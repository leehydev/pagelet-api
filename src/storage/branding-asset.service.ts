import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from './s3.service';
import { SiteService } from '../site/site.service';
import { BrandingPresignDto, BrandingType } from './dto/branding-presign.dto';
import { BrandingCommitDto } from './dto/branding-commit.dto';
import {
  BrandingPresignResponseDto,
  BrandingCommitResponseDto,
} from './dto/branding-response.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@Injectable()
export class BrandingAssetService {
  private readonly logger = new Logger(BrandingAssetService.name);

  // 브랜딩 타입별 허용 MIME 타입
  private readonly ALLOWED_MIME_TYPES: Record<BrandingType, string[]> = {
    [BrandingType.LOGO]: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    [BrandingType.FAVICON]: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/ico'],
    [BrandingType.OG]: ['image/png', 'image/jpeg', 'image/webp'],
  };

  // 브랜딩 타입별 최대 파일 크기 (bytes)
  private readonly MAX_FILE_SIZE: Record<BrandingType, number> = {
    [BrandingType.LOGO]: 2 * 1024 * 1024, // 2MB
    [BrandingType.FAVICON]: 512 * 1024, // 512KB
    [BrandingType.OG]: 5 * 1024 * 1024, // 5MB
  };

  constructor(
    private readonly s3Service: S3Service,
    private readonly siteService: SiteService,
  ) {}

  /**
   * 브랜딩 에셋 Presigned URL 생성 (tmp 경로)
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

    // tmp S3 Key 생성
    const tmpKey = this.s3Service.generateBrandingTmpKey(siteId, type, ext);

    // Presigned URL 생성 (5분 유효)
    const uploadUrl = await this.s3Service.generatePresignedUrl(tmpKey, mimeType, 300);
    const tmpPublicUrl = this.s3Service.getPublicUrl(tmpKey);

    this.logger.log(`Generated branding presign URL for site ${siteId}, type: ${type}`);

    return {
      uploadUrl,
      tmpPublicUrl,
      tmpKey,
    };
  }

  /**
   * 브랜딩 에셋 Commit (tmp → 최종 경로 복사 + Site 업데이트)
   */
  async commit(siteId: string, dto: BrandingCommitDto): Promise<BrandingCommitResponseDto> {
    const { type, tmpKey } = dto;

    // tmp Key가 해당 사이트의 것인지 검증
    if (!tmpKey.includes(`/sites/${siteId}/`)) {
      throw BusinessException.withMessage(
        ErrorCode.COMMON_FORBIDDEN,
        '다른 사이트의 리소스에 접근할 수 없습니다',
      );
    }

    // tmp 파일 존재 확인
    try {
      await this.s3Service.headObject(tmpKey);
    } catch {
      throw BusinessException.withMessage(
        ErrorCode.UPLOAD_NOT_FOUND,
        '임시 파일을 찾을 수 없습니다. 다시 업로드해주세요',
      );
    }

    // 확장자 추출 (tmp key에서)
    const ext = this.s3Service.extractExtension(tmpKey);

    // 최종 S3 Key 생성
    const finalKey = this.s3Service.generateBrandingFinalKey(siteId, type, ext);

    // S3 Copy (tmp → final)
    await this.s3Service.copyObject(tmpKey, finalKey);

    // tmp 파일 삭제
    try {
      await this.s3Service.deleteObject(tmpKey);
    } catch (error) {
      this.logger.warn(`Failed to delete tmp file ${tmpKey}: ${error.message}`);
      // tmp 삭제 실패해도 계속 진행
    }

    // Site 엔티티 업데이트
    const publicUrl = this.s3Service.getPublicUrl(finalKey);
    const updateData = this.getUpdateData(type, publicUrl);
    const updatedSite = await this.siteService.updateSettings(siteId, updateData);

    this.logger.log(`Committed branding asset for site ${siteId}, type: ${type}`);

    return {
      publicUrl,
      updatedAt: updatedSite.updatedAt.toISOString(),
    };
  }

  /**
   * 브랜딩 타입에 따른 Site 업데이트 데이터 생성
   */
  private getUpdateData(
    type: BrandingType,
    publicUrl: string,
  ): { logoImageUrl?: string; faviconUrl?: string; ogImageUrl?: string } {
    switch (type) {
      case BrandingType.LOGO:
        return { logoImageUrl: publicUrl };
      case BrandingType.FAVICON:
        return { faviconUrl: publicUrl };
      case BrandingType.OG:
        return { ogImageUrl: publicUrl };
    }
  }
}
