import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { ReservedSlug } from './entities/reserved-slug.entity';
import {
  UpdateSiteSettingsDto,
  SiteSettingsResponseDto,
  PublicSiteSettingsResponseDto,
} from './dto';
import { BrandingAssetService } from '../storage/branding-asset.service';
import { BrandingImageType } from '../storage/entities/site-branding-image.entity';

@Injectable()
export class SiteService {
  private readonly logger = new Logger(SiteService.name);

  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(ReservedSlug)
    private readonly reservedSlugRepository: Repository<ReservedSlug>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => BrandingAssetService))
    private readonly brandingAssetService: BrandingAssetService,
  ) {}

  /**
   * slug 기반으로 canonical base URL 생성
   */
  private generateCanonicalBaseUrl(slug: string): string {
    const tenantDomain = this.configService.get<string>('TENANT_DOMAIN');
    return `https://${slug}.${tenantDomain}`;
  }

  /**
   * slug 사용 가능 여부 확인
   * @param slug 확인할 슬러그
   * @param isAdmin 관리자 여부 (어드민 전용 슬러그 허용을 위해)
   */
  async isSlugAvailable(slug: string, isAdmin: boolean = false): Promise<boolean> {
    const normalizedSlug = slug.toLowerCase();

    // slug 형식 체크 (영소문자, 숫자, 하이픈만 허용, 3-50자)
    if (
      !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(normalizedSlug) ||
      normalizedSlug.length < 3 ||
      normalizedSlug.length > 50
    ) {
      return false;
    }

    // 예약어 체크 (DB 조회)
    const reservedSlug = await this.reservedSlugRepository.findOne({
      where: { slug: normalizedSlug },
    });

    if (reservedSlug) {
      // adminOnly가 true이고 관리자인 경우만 허용
      if (!reservedSlug.adminOnly || !isAdmin) {
        return false;
      }
    }

    // 중복 체크
    const existing = await this.siteRepository.findOne({ where: { slug: normalizedSlug } });
    return !existing;
  }

  /**
   * 예약어인지 확인 (adminOnly 정보 포함)
   */
  async checkReservedSlug(slug: string): Promise<{ reserved: boolean; adminOnly: boolean }> {
    const reservedSlug = await this.reservedSlugRepository.findOne({
      where: { slug: slug.toLowerCase() },
    });

    if (!reservedSlug) {
      return { reserved: false, adminOnly: false };
    }

    return { reserved: true, adminOnly: reservedSlug.adminOnly };
  }

  /**
   * 사이트 생성
   */
  async createSite(userId: string, name: string, slug: string): Promise<Site> {
    const site = this.siteRepository.create({
      userId: userId,
      name,
      slug: slug.toLowerCase(),
    });

    const saved = await this.siteRepository.save(site);
    this.logger.log(`Created site: ${saved.id} for user: ${userId}`);
    return saved;
  }

  /**
   * ID로 사이트 조회
   */
  async findById(siteId: string): Promise<Site | null> {
    return this.siteRepository.findOne({ where: { id: siteId } });
  }

  /**
   * 사용자의 사이트 조회 (단일)
   */
  async findByUserId(userId: string): Promise<Site | null> {
    return this.siteRepository.findOne({ where: { userId: userId } });
  }

  /**
   * 사용자의 모든 사이트 목록 조회
   */
  async findAllByUserId(userId: string): Promise<Site[]> {
    return this.siteRepository.find({
      where: { userId: userId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * slug로 사이트 조회
   */
  async findBySlug(slug: string): Promise<Site | null> {
    return this.siteRepository.findOne({ where: { slug: slug.toLowerCase() } });
  }

  /**
   * 예약어 목록 반환 (DB 조회)
   */
  async getReservedSlugs(): Promise<ReservedSlug[]> {
    return this.reservedSlugRepository.find({
      order: { slug: 'ASC' },
    });
  }

  /**
   * 예약어 슬러그 추가
   */
  async createReservedSlug(
    slug: string,
    reason: string | null,
    adminOnly: boolean,
  ): Promise<ReservedSlug> {
    const reservedSlug = this.reservedSlugRepository.create({
      slug: slug.toLowerCase(),
      reason,
      adminOnly,
    });

    const saved = await this.reservedSlugRepository.save(reservedSlug);
    this.logger.log(`Created reserved slug: ${saved.slug}`);
    return saved;
  }

  /**
   * 예약어 슬러그 삭제
   */
  async deleteReservedSlug(slugId: string): Promise<void> {
    const slug = await this.reservedSlugRepository.findOne({
      where: { id: slugId },
    });

    if (slug) {
      await this.reservedSlugRepository.remove(slug);
      this.logger.log(`Deleted reserved slug: ${slug.slug}`);
    }
  }

  /**
   * 예약어 슬러그 ID로 조회
   */
  async findReservedSlugById(slugId: string): Promise<ReservedSlug | null> {
    return this.reservedSlugRepository.findOne({
      where: { id: slugId },
    });
  }

  /**
   * 예약어 슬러그 중복 확인
   */
  async isReservedSlugExists(slug: string): Promise<boolean> {
    const existing = await this.reservedSlugRepository.findOne({
      where: { slug: slug.toLowerCase() },
    });
    return !!existing;
  }

  /**
   * Site를 SiteSettingsResponseDto로 변환 (Admin용 - 전체 필드)
   */
  async toSettingsResponse(site: Site): Promise<SiteSettingsResponseDto> {
    const brandingImages = await this.brandingAssetService.getAllActiveImageUrls(site.id);

    return {
      id: site.id,
      name: site.name,
      slug: site.slug,
      updatedAt: site.updatedAt,
      logoImageUrl: brandingImages[BrandingImageType.LOGO],
      faviconUrl: brandingImages[BrandingImageType.FAVICON],
      ogImageUrl: brandingImages[BrandingImageType.OG],
      seoTitle: site.seoTitle,
      seoDescription: site.seoDescription,
      seoKeywords: site.seoKeywords,
      canonicalBaseUrl: this.generateCanonicalBaseUrl(site.slug),
      robotsIndex: site.robotsIndex,
      contactEmail: site.contactEmail,
      contactPhone: site.contactPhone,
      address: site.address,
      kakaoChannelUrl: site.kakaoChannelUrl,
      naverMapUrl: site.naverMapUrl,
      instagramUrl: site.instagramUrl,
      businessNumber: site.businessNumber,
      businessName: site.businessName,
      representativeName: site.representativeName,
      fontKey: site.fontKey,
      naverSearchAdvisorKey: site.naverSearchAdvisorKey,
      ctaEnabled: site.ctaEnabled,
      ctaType: site.ctaType,
      ctaText: site.ctaText,
      ctaImageUrl: brandingImages[BrandingImageType.CTA],
      ctaLink: site.ctaLink,
      adProvider: site.adProvider,
      adMobileHeader: site.adMobileHeader,
      adPcSidebar: site.adPcSidebar,
    };
  }

  /**
   * Site를 PublicSiteSettingsResponseDto로 변환 (Public API용 - 공개 필드만)
   */
  async toPublicSettingsResponse(site: Site): Promise<PublicSiteSettingsResponseDto> {
    const brandingImages = await this.brandingAssetService.getAllActiveImageUrls(site.id);

    return {
      id: site.id,
      name: site.name,
      slug: site.slug,
      logoImageUrl: brandingImages[BrandingImageType.LOGO],
      faviconUrl: brandingImages[BrandingImageType.FAVICON],
      ogImageUrl: brandingImages[BrandingImageType.OG],
      seoTitle: site.seoTitle,
      seoDescription: site.seoDescription,
      seoKeywords: site.seoKeywords,
      canonicalBaseUrl: this.generateCanonicalBaseUrl(site.slug),
      robotsIndex: site.robotsIndex,
      contactEmail: site.contactEmail,
      contactPhone: site.contactPhone,
      address: site.address,
      kakaoChannelUrl: site.kakaoChannelUrl,
      naverMapUrl: site.naverMapUrl,
      instagramUrl: site.instagramUrl,
      businessNumber: site.businessNumber,
      businessName: site.businessName,
      representativeName: site.representativeName,
      fontKey: site.fontKey,
      naverSearchAdvisorKey: site.naverSearchAdvisorKey,
      ctaEnabled: site.ctaEnabled,
      ctaType: site.ctaType,
      ctaText: site.ctaText,
      ctaImageUrl: brandingImages[BrandingImageType.CTA],
      ctaLink: site.ctaLink,
      adProvider: site.adProvider,
      adMobileHeader: site.adMobileHeader,
      adPcSidebar: site.adPcSidebar,
    };
  }

  /**
   * slug로 사이트 설정 조회 (공개)
   */
  async getSettingsBySlug(slug: string): Promise<SiteSettingsResponseDto> {
    const site = await this.findBySlug(slug);
    if (!site) {
      throw new NotFoundException('사이트를 찾을 수 없습니다');
    }
    return this.toSettingsResponse(site);
  }

  /**
   * 사이트 설정 업데이트 (by siteId)
   * 브랜딩 이미지는 BrandingAssetService를 통해 관리됨
   */
  async updateSettings(
    siteId: string,
    dto: UpdateSiteSettingsDto,
  ): Promise<SiteSettingsResponseDto> {
    const site = await this.siteRepository.findOne({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundException('사이트를 찾을 수 없습니다');
    }

    // 허용된 필드만 명시적으로 업데이트 (브랜딩 이미지 제외)
    if (dto.seoTitle !== undefined) site.seoTitle = dto.seoTitle;
    if (dto.seoDescription !== undefined) site.seoDescription = dto.seoDescription;
    if (dto.seoKeywords !== undefined) site.seoKeywords = dto.seoKeywords;
    if (dto.robotsIndex !== undefined) site.robotsIndex = dto.robotsIndex;
    if (dto.contactEmail !== undefined) site.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) site.contactPhone = dto.contactPhone;
    if (dto.address !== undefined) site.address = dto.address;
    if (dto.kakaoChannelUrl !== undefined) site.kakaoChannelUrl = dto.kakaoChannelUrl;
    if (dto.naverMapUrl !== undefined) site.naverMapUrl = dto.naverMapUrl;
    if (dto.instagramUrl !== undefined) site.instagramUrl = dto.instagramUrl;
    if (dto.businessNumber !== undefined) site.businessNumber = dto.businessNumber;
    if (dto.businessName !== undefined) site.businessName = dto.businessName;
    if (dto.representativeName !== undefined) site.representativeName = dto.representativeName;
    if (dto.fontKey !== undefined) site.fontKey = dto.fontKey;
    if (dto.naverSearchAdvisorKey !== undefined)
      site.naverSearchAdvisorKey = dto.naverSearchAdvisorKey;
    if (dto.ctaEnabled !== undefined) site.ctaEnabled = dto.ctaEnabled;
    if (dto.ctaType !== undefined) site.ctaType = dto.ctaType;
    if (dto.ctaText !== undefined) site.ctaText = dto.ctaText;
    if (dto.ctaLink !== undefined) site.ctaLink = dto.ctaLink;
    if (dto.adProvider !== undefined) site.adProvider = dto.adProvider;
    if (dto.adMobileHeader !== undefined) site.adMobileHeader = dto.adMobileHeader;
    if (dto.adPcSidebar !== undefined) site.adPcSidebar = dto.adPcSidebar;

    const updated = await this.siteRepository.save(site);
    this.logger.log(`Updated site settings: ${updated.id}`);
    return this.toSettingsResponse(updated);
  }
}
