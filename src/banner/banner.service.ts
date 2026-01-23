import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { SiteBanner } from './entities/site-banner.entity';
import { S3Service } from '../storage/s3.service';
import { SiteService } from '../site/site.service';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import {
  BannerPresignDto,
  BannerPresignResponseDto,
  CreateBannerDto,
  UpdateBannerDto,
  UpdateBannerOrderDto,
  BannerResponseDto,
  PublicBannerResponseDto,
} from './dto';

// 배너 관련 상수
const MAX_BANNERS_PER_DEVICE = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);

  constructor(
    @InjectRepository(SiteBanner)
    private readonly bannerRepository: Repository<SiteBanner>,
    private readonly s3Service: S3Service,
    private readonly siteService: SiteService,
  ) {}

  /**
   * 배너 이미지 Presigned URL 발급
   */
  async presign(siteId: string, dto: BannerPresignDto): Promise<BannerPresignResponseDto> {
    const { filename, size, mimeType } = dto;

    // MIME 타입 검증
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw BusinessException.fromErrorCode(
        ErrorCode.UPLOAD_INVALID,
        '지원하지 않는 파일 형식입니다. PNG, JPEG, WebP만 가능합니다',
      );
    }

    // 파일 크기 검증
    if (size > MAX_FILE_SIZE) {
      throw BusinessException.fromErrorCode(
        ErrorCode.UPLOAD_INVALID,
        '파일 크기는 최대 5MB까지 가능합니다',
      );
    }

    // 확장자 추출
    const ext = this.s3Service.extractExtension(filename);

    // S3 Key 생성
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const s3Key = `uploads/sites/${siteId}/banners/${timestamp}-${random}.${ext}`;

    // Presigned URL 생성 (5분 유효)
    const uploadUrl = await this.s3Service.generatePresignedUrl(s3Key, mimeType, 300);
    const publicUrl = this.s3Service.getPublicUrl(s3Key);

    this.logger.log(`Generated banner presign URL for site ${siteId}`);

    return new BannerPresignResponseDto({
      uploadUrl,
      publicUrl,
    });
  }

  /**
   * 배너 생성
   */
  async create(siteId: string, dto: CreateBannerDto): Promise<SiteBanner> {
    // 동일 deviceType 배너 수 제한 검증
    const existingCount = await this.bannerRepository.count({
      where: { siteId, deviceType: dto.deviceType },
    });

    if (existingCount >= MAX_BANNERS_PER_DEVICE) {
      throw BusinessException.fromErrorCode(ErrorCode.BANNER_LIMIT_EXCEEDED);
    }

    // displayOrder가 제공되지 않으면 마지막 순서 + 1
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined) {
      const lastBanner = await this.bannerRepository.findOne({
        where: { siteId, deviceType: dto.deviceType },
        order: { displayOrder: 'DESC' },
      });
      displayOrder = lastBanner ? lastBanner.displayOrder + 1 : 0;
    }

    const banner = this.bannerRepository.create({
      siteId,
      imageUrl: dto.imageUrl,
      linkUrl: dto.linkUrl || null,
      openInNewTab: dto.openInNewTab ?? true,
      isActive: dto.isActive ?? true,
      startAt: dto.startAt ? new Date(dto.startAt) : null,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
      displayOrder,
      altText: dto.altText || null,
      deviceType: dto.deviceType,
    });

    const saved = await this.bannerRepository.save(banner);
    this.logger.log(`Created banner: ${saved.id} for site: ${siteId}`);
    return saved;
  }

  /**
   * 사이트의 배너 목록 조회 (Admin용)
   */
  async findBySiteId(siteId: string, deviceType?: string): Promise<SiteBanner[]> {
    const where: { siteId: string; deviceType?: string } = { siteId };
    if (deviceType) {
      where.deviceType = deviceType;
    }

    return this.bannerRepository.find({
      where,
      order: { deviceType: 'ASC', displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * 배너 ID로 조회
   */
  async findById(bannerId: string): Promise<SiteBanner | null> {
    return this.bannerRepository.findOne({ where: { id: bannerId } });
  }

  /**
   * 배너 수정
   */
  async update(bannerId: string, siteId: string, dto: UpdateBannerDto): Promise<SiteBanner> {
    const banner = await this.findById(bannerId);
    if (!banner) {
      throw BusinessException.fromErrorCode(ErrorCode.BANNER_NOT_FOUND);
    }

    // 다른 사이트의 배너는 수정 불가
    if (banner.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_FORBIDDEN);
    }

    // 필드별 업데이트
    if (dto.imageUrl !== undefined) banner.imageUrl = dto.imageUrl;
    if (dto.linkUrl !== undefined) banner.linkUrl = dto.linkUrl;
    if (dto.openInNewTab !== undefined) banner.openInNewTab = dto.openInNewTab;
    if (dto.isActive !== undefined) banner.isActive = dto.isActive;
    if (dto.startAt !== undefined) banner.startAt = dto.startAt ? new Date(dto.startAt) : null;
    if (dto.endAt !== undefined) banner.endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (dto.displayOrder !== undefined) banner.displayOrder = dto.displayOrder;
    if (dto.altText !== undefined) banner.altText = dto.altText;

    const updated = await this.bannerRepository.save(banner);
    this.logger.log(`Updated banner: ${updated.id}`);
    return updated;
  }

  /**
   * 배너 삭제
   */
  async delete(bannerId: string, siteId: string): Promise<void> {
    const banner = await this.findById(bannerId);
    if (!banner) {
      throw BusinessException.fromErrorCode(ErrorCode.BANNER_NOT_FOUND);
    }

    // 다른 사이트의 배너는 삭제 불가
    if (banner.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_FORBIDDEN);
    }

    await this.bannerRepository.remove(banner);
    this.logger.log(`Deleted banner: ${bannerId}`);
  }

  /**
   * 배너 순서 변경
   */
  async updateOrder(siteId: string, dto: UpdateBannerOrderDto): Promise<SiteBanner[]> {
    const { bannerIds, deviceType } = dto;

    // 해당 deviceType의 모든 배너 조회
    const banners = await this.bannerRepository.find({
      where: { siteId, deviceType, id: In(bannerIds) },
    });

    // 모든 배너가 존재하는지 검증
    if (banners.length !== bannerIds.length) {
      throw BusinessException.fromErrorCode(
        ErrorCode.BANNER_NOT_FOUND,
        '일부 배너를 찾을 수 없습니다',
      );
    }

    // 순서 업데이트
    const bannerMap = new Map(banners.map((b) => [b.id, b]));
    const updatedBanners: SiteBanner[] = [];

    for (let i = 0; i < bannerIds.length; i++) {
      const banner = bannerMap.get(bannerIds[i]);
      if (banner) {
        banner.displayOrder = i;
        updatedBanners.push(banner);
      }
    }

    await this.bannerRepository.save(updatedBanners);
    this.logger.log(`Updated banner order for site: ${siteId}, deviceType: ${deviceType}`);

    return this.findBySiteId(siteId, deviceType);
  }

  /**
   * 공개 배너 조회 (Public API용)
   * - isActive가 true
   * - 현재 시간이 startAt ~ endAt 범위 내
   */
  async findActiveBySlug(siteSlug: string, deviceType: string): Promise<SiteBanner[]> {
    // siteSlug로 사이트 조회
    const site = await this.siteService.findBySlug(siteSlug);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const now = new Date();

    // QueryBuilder를 사용하여 복잡한 조건 처리
    const banners = await this.bannerRepository
      .createQueryBuilder('banner')
      .where('banner.siteId = :siteId', { siteId: site.id })
      .andWhere('banner.deviceType = :deviceType', { deviceType })
      .andWhere('banner.isActive = :isActive', { isActive: true })
      .andWhere('(banner.startAt IS NULL OR banner.startAt <= :now)', { now })
      .andWhere('(banner.endAt IS NULL OR banner.endAt >= :now)', { now })
      .orderBy('banner.displayOrder', 'ASC')
      .addOrderBy('banner.createdAt', 'ASC')
      .getMany();

    return banners;
  }

  /**
   * Entity를 BannerResponseDto로 변환
   */
  toBannerResponse(banner: SiteBanner): BannerResponseDto {
    return new BannerResponseDto({
      id: banner.id,
      siteId: banner.siteId,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      openInNewTab: banner.openInNewTab,
      isActive: banner.isActive,
      startAt: banner.startAt,
      endAt: banner.endAt,
      displayOrder: banner.displayOrder,
      altText: banner.altText,
      deviceType: banner.deviceType,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    });
  }

  /**
   * Entity를 PublicBannerResponseDto로 변환
   */
  toPublicBannerResponse(banner: SiteBanner): PublicBannerResponseDto {
    return new PublicBannerResponseDto({
      id: banner.id,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      openInNewTab: banner.openInNewTab,
      altText: banner.altText,
      displayOrder: banner.displayOrder,
    });
  }
}
