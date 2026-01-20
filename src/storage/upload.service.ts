import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { S3Service } from './s3.service';
import { StorageUsageService } from './storage-usage.service';
import { PostImageService } from './post-image.service';
import { PostImageType } from './entities/post-image.entity';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly MAX_FILE_SIZE = 2097152; // 2MB

  constructor(
    private readonly s3Service: S3Service,
    private readonly storageUsageService: StorageUsageService,
    private readonly postImageService: PostImageService,
  ) {}

  /**
   * Presigned URL 생성 및 용량 예약
   */
  async presignUpload(siteId: string, dto: PresignUploadDto) {
    // 파일 크기 검증
    if (dto.size > this.MAX_FILE_SIZE) {
      throw BusinessException.withMessage(
        ErrorCode.UPLOAD_INVALID,
        `파일 크기는 최대 ${this.MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다`,
      );
    }

    // MIME 타입 검증 (이미지만 허용: JPEG, PNG, WebP만)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(dto.mimeType)) {
      throw BusinessException.withMessage(
        ErrorCode.UPLOAD_INVALID,
        '지원하지 않는 파일 형식입니다. JPEG, PNG, WebP만 가능합니다',
      );
    }

    // 용량 예약
    await this.storageUsageService.reserveBytes(siteId, dto.size);

    // S3 Key 생성
    const s3Key = this.s3Service.generateS3Key(siteId, dto.filename);

    // PostImage 엔티티 생성 (임시 기록)
    const imageType = dto.imageType || PostImageType.THUMBNAIL;
    const postImage = await this.postImageService.create({
      site_id: siteId,
      post_id: dto.postId || null,
      s3_key: s3Key,
      size_bytes: dto.size,
      mime_type: dto.mimeType,
      image_type: imageType,
    });

    // Presigned URL 생성
    const uploadUrl = await this.s3Service.generatePresignedUrl(s3Key, dto.mimeType, 300);
    const publicUrl = this.s3Service.getPublicUrl(s3Key);

    this.logger.log(`Generated presigned URL for site ${siteId}, s3Key: ${s3Key}`);

    return {
      uploadUrl,
      publicUrl,
      s3Key,
      maxSize: this.MAX_FILE_SIZE,
      imageId: postImage.id,
    };
  }

  /**
   * 업로드 완료 확정
   */
  async completeUpload(siteId: string, dto: CompleteUploadDto) {
    // PostImage 조회
    const postImage = await this.postImageService.findByS3Key(dto.s3Key);

    if (!postImage) {
      throw BusinessException.withMessage(
        ErrorCode.UPLOAD_NOT_FOUND,
        '업로드 정보를 찾을 수 없습니다',
      );
    }

    // 사이트 ID 검증
    if (postImage.site_id !== siteId) {
      throw BusinessException.withMessage(
        ErrorCode.COMMON_FORBIDDEN,
        '다른 사이트의 업로드에 접근할 수 없습니다',
      );
    }

    // S3 업로드 검증 (HEAD Object)
    let actualSize: number;
    let mimeType: string;

    try {
      const headObject = await this.s3Service.headObject(dto.s3Key);
      actualSize = headObject.ContentLength;
      mimeType = headObject.ContentType;
    } catch (error) {
      this.logger.warn(`Failed to head object ${dto.s3Key}: ${error.message}`);
      // HEAD 실패 시 presign 시점의 값 사용
      actualSize = postImage.size_bytes;
      mimeType = postImage.mime_type;
    }

    // PostImage 업데이트
    if (dto.postId) {
      await this.postImageService.updatePostId(postImage.id, dto.postId, actualSize, mimeType);
    }

    // 예약 → 사용으로 이동
    await this.storageUsageService.commitBytes(
      siteId,
      postImage.size_bytes, // presign 시 예약한 크기
      actualSize, // 실제 업로드된 크기
    );

    const publicUrl = this.s3Service.getPublicUrl(dto.s3Key);

    this.logger.log(`Completed upload for site ${siteId}, s3Key: ${dto.s3Key}`);

    return {
      imageId: postImage.id,
      publicUrl,
    };
  }

  /**
   * 업로드 중단
   */
  async abortUpload(siteId: string, s3Key: string) {
    // PostImage 조회
    const postImage = await this.postImageService.findByS3Key(s3Key);

    if (!postImage) {
      // 이미 완료되었거나 존재하지 않음 (idempotent)
      this.logger.warn(`PostImage not found for s3Key: ${s3Key}, skipping abort`);
      return;
    }

    // 사이트 ID 검증
    if (postImage.site_id !== siteId) {
      throw BusinessException.withMessage(
        ErrorCode.COMMON_FORBIDDEN,
        '다른 사이트의 업로드에 접근할 수 없습니다',
      );
    }

    // 예약 취소
    await this.storageUsageService.releaseBytes(siteId, postImage.size_bytes);

    // PostImage 삭제
    await this.postImageService.deleteByS3Key(s3Key);

    // (선택) S3 오브젝트 삭제
    try {
      await this.s3Service.deleteObject(s3Key);
    } catch (error) {
      this.logger.warn(`Failed to delete S3 object ${s3Key}: ${error.message}`);
      // S3 삭제 실패해도 계속 진행 (이미 예약은 해제됨)
    }

    this.logger.log(`Aborted upload for site ${siteId}, s3Key: ${s3Key}`);
  }
}
