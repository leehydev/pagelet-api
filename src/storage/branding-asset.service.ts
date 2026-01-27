import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Service } from './s3.service';
import { BrandingPresignDto, BrandingType } from './dto/branding-presign.dto';
import { BrandingCommitDto } from './dto/branding-commit.dto';
import { BrandingPresignResponseDto, BrandingCommitResponseDto } from './dto/branding-response.dto';
import { BrandingDeleteResponseDto } from './dto/branding-delete.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { SiteBrandingImage, BrandingImageType } from './entities/site-branding-image.entity';

@Injectable()
export class BrandingAssetService {
  private readonly logger = new Logger(BrandingAssetService.name);

  // 브랜딩 타입별 허용 MIME 타입
  private readonly ALLOWED_MIME_TYPES: Record<BrandingType, string[]> = {
    [BrandingType.LOGO]: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    [BrandingType.FAVICON]: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/ico'],
    [BrandingType.OG]: ['image/png', 'image/jpeg', 'image/webp'],
    [BrandingType.CTA]: ['image/png', 'image/jpeg', 'image/webp'],
  };

  // 브랜딩 타입별 최대 파일 크기 (bytes)
  private readonly MAX_FILE_SIZE: Record<BrandingType, number> = {
    [BrandingType.LOGO]: 2 * 1024 * 1024, // 2MB
    [BrandingType.FAVICON]: 512 * 1024, // 512KB
    [BrandingType.OG]: 5 * 1024 * 1024, // 5MB
    [BrandingType.CTA]: 5 * 1024 * 1024, // 5MB
  };

  // BrandingType → BrandingImageType 매핑
  private readonly TYPE_MAP: Record<BrandingType, BrandingImageType> = {
    [BrandingType.LOGO]: BrandingImageType.LOGO,
    [BrandingType.FAVICON]: BrandingImageType.FAVICON,
    [BrandingType.OG]: BrandingImageType.OG,
    [BrandingType.CTA]: BrandingImageType.CTA,
  };

  constructor(
    @InjectRepository(SiteBrandingImage)
    private readonly brandingImageRepository: Repository<SiteBrandingImage>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * 브랜딩 에셋 Presigned URL 생성
   */
  async presign(siteId: string, dto: BrandingPresignDto): Promise<BrandingPresignResponseDto> {
    const { type, filename, size, mimeType } = dto;

    // MIME 타입 검증
    const allowedTypes = this.ALLOWED_MIME_TYPES[type];
    if (!allowedTypes.includes(mimeType)) {
      throw BusinessException.withMessage(
        ErrorCode.UPLOAD_INVALID,
        `지원하지 않는 파일 형식입니다. ${type === BrandingType.FAVICON ? 'PNG, ICO' : 'PNG, JPEG, WebP'}만 가능합니다`,
      );
    }

    // 파일 크기 검증
    const maxSize = this.MAX_FILE_SIZE[type];
    if (size > maxSize) {
      throw BusinessException.withMessage(
        ErrorCode.UPLOAD_INVALID,
        `파일 크기는 최대 ${Math.floor(maxSize / 1024)}KB까지 가능합니다`,
      );
    }

    // 확장자 추출
    const ext = this.s3Service.extractExtension(filename);

    // S3 Key 생성 (바로 최종 경로로)
    const s3Key = this.s3Service.generateBrandingFinalKey(siteId, type, ext);

    // Presigned URL 생성 (5분 유효)
    const uploadUrl = await this.s3Service.generatePresignedUrl(s3Key, mimeType, 300);
    const publicUrl = this.s3Service.getPublicUrl(s3Key);

    this.logger.log(`Generated branding presign URL for site ${siteId}, type: ${type}`);

    return {
      uploadUrl,
      tmpPublicUrl: publicUrl,
      tmpKey: s3Key,
    };
  }

  /**
   * 브랜딩 에셋 Commit (DB에 저장 + 활성화)
   */
  async commit(siteId: string, dto: BrandingCommitDto): Promise<BrandingCommitResponseDto> {
    const { type, tmpKey } = dto;

    // S3 Key가 해당 사이트의 것인지 검증
    if (!tmpKey.includes(`/sites/${siteId}/`)) {
      throw BusinessException.withMessage(
        ErrorCode.COMMON_FORBIDDEN,
        '다른 사이트의 리소스에 접근할 수 없습니다',
      );
    }

    // S3 파일 존재 확인
    try {
      await this.s3Service.headObject(tmpKey);
    } catch {
      throw BusinessException.withMessage(
        ErrorCode.UPLOAD_NOT_FOUND,
        '파일을 찾을 수 없습니다. 다시 업로드해주세요',
      );
    }

    const imageType = this.TYPE_MAP[type];

    // 기존 활성 이미지 비활성화
    await this.brandingImageRepository.update(
      { siteId, type: imageType, isActive: true },
      { isActive: false },
    );

    // 새 브랜딩 이미지 레코드 생성 (활성 상태로)
    const brandingImage = this.brandingImageRepository.create({
      siteId,
      type: imageType,
      s3Key: tmpKey,
      isActive: true,
    });
    await this.brandingImageRepository.save(brandingImage);

    const publicUrl = this.s3Service.getPublicUrl(tmpKey);

    this.logger.log(`Committed branding asset for site ${siteId}, type: ${type}`);

    return {
      publicUrl,
      updatedAt: brandingImage.createdAt.toISOString(),
    };
  }

  /**
   * 브랜딩 에셋 삭제 (S3 파일 삭제 + DB 레코드 삭제)
   */
  async delete(siteId: string, type: BrandingType): Promise<BrandingDeleteResponseDto> {
    const imageType = this.TYPE_MAP[type];

    // 활성 이미지 조회
    const activeImage = await this.brandingImageRepository.findOne({
      where: { siteId, type: imageType, isActive: true },
    });

    if (!activeImage) {
      throw BusinessException.withMessage(ErrorCode.COMMON_NOT_FOUND, '삭제할 이미지가 없습니다');
    }

    // S3에서 파일 삭제
    try {
      await this.s3Service.deleteObject(activeImage.s3Key);
    } catch (error) {
      this.logger.warn(`Failed to delete S3 object ${activeImage.s3Key}: ${error.message}`);
    }

    // DB 레코드 삭제
    await this.brandingImageRepository.remove(activeImage);

    this.logger.log(`Deleted branding asset for site ${siteId}, type: ${type}`);

    return {
      deleted: true,
      type,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 사이트의 활성 브랜딩 이미지 URL 조회
   */
  async getActiveImageUrl(siteId: string, type: BrandingImageType): Promise<string | null> {
    const image = await this.brandingImageRepository.findOne({
      where: { siteId, type, isActive: true },
    });

    if (!image) {
      return null;
    }

    return this.s3Service.getPublicUrl(image.s3Key);
  }

  /**
   * 사이트의 모든 활성 브랜딩 이미지 URL 조회
   */
  async getAllActiveImageUrls(siteId: string): Promise<Record<BrandingImageType, string | null>> {
    const images = await this.brandingImageRepository.find({
      where: { siteId, isActive: true },
    });

    const result: Record<BrandingImageType, string | null> = {
      [BrandingImageType.LOGO]: null,
      [BrandingImageType.FAVICON]: null,
      [BrandingImageType.OG]: null,
      [BrandingImageType.CTA]: null,
    };

    for (const image of images) {
      result[image.type] = this.s3Service.getPublicUrl(image.s3Key);
    }

    return result;
  }

  /**
   * 비활성 브랜딩 이미지 정리 (크론잡용)
   * @param olderThanHours 이 시간보다 오래된 비활성 이미지 삭제
   */
  async cleanupInactiveImages(olderThanHours: number = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const inactiveImages = await this.brandingImageRepository
      .createQueryBuilder('image')
      .where('image.isActive = :isActive', { isActive: false })
      .andWhere('image.createdAt < :cutoffDate', { cutoffDate })
      .getMany();

    let deletedCount = 0;
    for (const image of inactiveImages) {
      try {
        await this.s3Service.deleteObject(image.s3Key);
        await this.brandingImageRepository.remove(image);
        deletedCount++;
      } catch (error) {
        this.logger.warn(`Failed to cleanup branding image ${image.id}: ${error.message}`);
      }
    }

    if (deletedCount > 0) {
      this.logger.log(`Cleaned up ${deletedCount} inactive branding images`);
    }

    return deletedCount;
  }
}
