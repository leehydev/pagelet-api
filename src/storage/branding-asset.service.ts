import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from './s3.service';
import { SiteService } from '../site/site.service';
import { BrandingPresignDto, BrandingType } from './dto/branding-presign.dto';
import { BrandingCommitDto } from './dto/branding-commit.dto';
import { BrandingPresignResponseDto, BrandingCommitResponseDto } from './dto/branding-response.dto';
import { BrandingDeleteResponseDto } from './dto/branding-delete.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { Site } from '../site/entities/site.entity';

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
   * 브랜딩 에셋 삭제 (S3 파일 삭제 + Site 필드 null 처리)
   */
  async delete(siteId: string, type: BrandingType): Promise<BrandingDeleteResponseDto> {
    // 1. Site 조회
    const site = await this.siteService.findById(siteId);
    if (!site) {
      throw BusinessException.withMessage(ErrorCode.SITE_NOT_FOUND, '사이트를 찾을 수 없습니다');
    }

    // 2. 현재 이미지 URL 확인
    const currentUrl = this.getCurrentImageUrl(site, type);
    if (!currentUrl) {
      throw BusinessException.withMessage(ErrorCode.COMMON_NOT_FOUND, '삭제할 이미지가 없습니다');
    }

    // 3. URL에서 S3 Key 추출
    const s3Key = this.extractS3KeyFromUrl(currentUrl);

    // 4. S3에서 파일 삭제
    try {
      await this.s3Service.deleteObject(s3Key);
    } catch (error) {
      this.logger.warn(`Failed to delete S3 object ${s3Key}: ${error.message}`);
      // S3 삭제 실패해도 DB 업데이트는 진행 (파일이 이미 삭제되었을 수 있음)
    }

    // 5. Site 엔티티 업데이트 (해당 필드 null로)
    const updateData = this.getNullUpdateData(type);
    const updatedSite = await this.siteService.updateSettings(siteId, updateData);

    this.logger.log(`Deleted branding asset for site ${siteId}, type: ${type}`);

    return {
      deleted: true,
      type,
      updatedAt: updatedSite.updatedAt.toISOString(),
    };
  }

  /**
   * 브랜딩 타입에 따른 현재 이미지 URL 조회
   */
  private getCurrentImageUrl(site: Site, type: BrandingType): string | null {
    switch (type) {
      case BrandingType.LOGO:
        return site.logoImageUrl;
      case BrandingType.FAVICON:
        return site.faviconUrl;
      case BrandingType.OG:
        return site.ogImageUrl;
      case BrandingType.CTA:
        return site.ctaImageUrl;
    }
  }

  /**
   * 브랜딩 타입에 따른 null 업데이트 데이터 생성
   */
  private getNullUpdateData(type: BrandingType): {
    logoImageUrl?: null;
    faviconUrl?: null;
    ogImageUrl?: null;
    ctaImageUrl?: null;
  } {
    switch (type) {
      case BrandingType.LOGO:
        return { logoImageUrl: null };
      case BrandingType.FAVICON:
        return { faviconUrl: null };
      case BrandingType.OG:
        return { ogImageUrl: null };
      case BrandingType.CTA:
        return { ctaImageUrl: null };
    }
  }

  /**
   * CDN URL에서 S3 Key 추출
   * 예: https://assets.pagelet-dev.kr/uploads/sites/{siteId}/branding/logo.png
   *   → uploads/sites/{siteId}/branding/logo.png
   */
  private extractS3KeyFromUrl(url: string): string {
    const cdnBaseUrl = this.s3Service.getAssetsCdnBaseUrl();
    return url.replace(`${cdnBaseUrl}/`, '');
  }

  /**
   * 브랜딩 타입에 따른 Site 업데이트 데이터 생성
   */
  private getUpdateData(
    type: BrandingType,
    publicUrl: string,
  ): { logoImageUrl?: string; faviconUrl?: string; ogImageUrl?: string; ctaImageUrl?: string } {
    switch (type) {
      case BrandingType.LOGO:
        return { logoImageUrl: publicUrl };
      case BrandingType.FAVICON:
        return { faviconUrl: publicUrl };
      case BrandingType.OG:
        return { ogImageUrl: publicUrl };
      case BrandingType.CTA:
        return { ctaImageUrl: publicUrl };
    }
  }
}
