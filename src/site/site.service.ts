import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import {
  UpdateSiteSettingsDto,
  SiteSettingsResponseDto,
  PublicSiteSettingsResponseDto,
} from './dto';

// 예약어 목록
const RESERVED_SLUGS = new Set([
  'www',
  'app',
  'admin',
  'api',
  'auth',
  'login',
  'signup',
  'signin',
  'signout',
  'register',
  'dashboard',
  'settings',
  'profile',
  'help',
  'support',
  'blog',
  'about',
  'contact',
  'terms',
  'privacy',
  'static',
  'assets',
  'public',
  'cdn',
  'mail',
  'email',
]);

@Injectable()
export class SiteService {
  private readonly logger = new Logger(SiteService.name);

  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    private readonly configService: ConfigService,
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
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    // 예약어 체크
    if (RESERVED_SLUGS.has(slug.toLowerCase())) {
      return false;
    }

    // slug 형식 체크 (영소문자, 숫자, 하이픈만 허용, 3-50자)
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) || slug.length < 3 || slug.length > 50) {
      return false;
    }

    // 중복 체크
    const existing = await this.siteRepository.findOne({ where: { slug } });
    return !existing;
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
   * 예약어 목록 반환
   */
  getReservedSlugs(): string[] {
    return Array.from(RESERVED_SLUGS);
  }

  /**
   * Site를 SiteSettingsResponseDto로 변환 (Admin용 - 전체 필드)
   */
  toSettingsResponsePublic(site: Site): SiteSettingsResponseDto {
    return {
      id: site.id,
      name: site.name,
      slug: site.slug,
      updatedAt: site.updatedAt,
      logoImageUrl: site.logoImageUrl,
      faviconUrl: site.faviconUrl,
      ogImageUrl: site.ogImageUrl,
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
      ctaEnabled: site.ctaEnabled,
      ctaType: site.ctaType,
      ctaText: site.ctaText,
      ctaImageUrl: site.ctaImageUrl,
      ctaLink: site.ctaLink,
    };
  }

  /**
   * Site를 PublicSiteSettingsResponseDto로 변환 (Public API용 - 공개 필드만)
   */
  toPublicSettingsResponse(site: Site): PublicSiteSettingsResponseDto {
    return {
      name: site.name,
      slug: site.slug,
      logoImageUrl: site.logoImageUrl,
      faviconUrl: site.faviconUrl,
      ogImageUrl: site.ogImageUrl,
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
      ctaEnabled: site.ctaEnabled,
      ctaType: site.ctaType,
      ctaText: site.ctaText,
      ctaImageUrl: site.ctaImageUrl,
      ctaLink: site.ctaLink,
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
    return this.toSettingsResponsePublic(site);
  }

  /**
   * 사이트 설정 업데이트 (by siteId)
   */
  async updateSettings(
    siteId: string,
    dto: UpdateSiteSettingsDto,
  ): Promise<SiteSettingsResponseDto> {
    const site = await this.siteRepository.findOne({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundException('사이트를 찾을 수 없습니다');
    }

    // 허용된 필드만 명시적으로 업데이트 (Defense in Depth)
    if (dto.logoImageUrl !== undefined) site.logoImageUrl = dto.logoImageUrl;
    if (dto.faviconUrl !== undefined) site.faviconUrl = dto.faviconUrl;
    if (dto.ogImageUrl !== undefined) site.ogImageUrl = dto.ogImageUrl;
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
    if (dto.ctaEnabled !== undefined) site.ctaEnabled = dto.ctaEnabled;
    if (dto.ctaType !== undefined) site.ctaType = dto.ctaType;
    if (dto.ctaText !== undefined) site.ctaText = dto.ctaText;
    if (dto.ctaImageUrl !== undefined) site.ctaImageUrl = dto.ctaImageUrl;
    if (dto.ctaLink !== undefined) site.ctaLink = dto.ctaLink;

    const updated = await this.siteRepository.save(site);
    this.logger.log(`Updated site settings: ${updated.id}`);
    return this.toSettingsResponsePublic(updated);
  }
}
