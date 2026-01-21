import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  ) {}

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
   * 사용자의 사이트 조회
   */
  async findByUserId(userId: string): Promise<Site | null> {
    return this.siteRepository.findOne({ where: { userId: userId } });
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
      logo_image_url: site.logoImageUrl,
      favicon_url: site.faviconUrl,
      og_image_url: site.ogImageUrl,
      seo_title: site.seoTitle,
      seo_description: site.seoDescription,
      seo_keywords: site.seoKeywords,
      canonical_base_url: site.canonicalBaseUrl,
      robots_index: site.robotsIndex,
      contact_email: site.contactEmail,
      contact_phone: site.contactPhone,
      address: site.address,
      kakao_channel_url: site.kakaoChannelUrl,
      naver_map_url: site.naverMapUrl,
      instagram_url: site.instagramUrl,
      business_number: site.businessNumber,
      business_name: site.businessName,
      representative_name: site.representativeName,
    };
  }

  /**
   * Site를 PublicSiteSettingsResponseDto로 변환 (Public API용 - 공개 필드만)
   */
  toPublicSettingsResponse(site: Site): PublicSiteSettingsResponseDto {
    return {
      name: site.name,
      slug: site.slug,
      logo_image_url: site.logoImageUrl,
      favicon_url: site.faviconUrl,
      og_image_url: site.ogImageUrl,
      seo_title: site.seoTitle,
      seo_description: site.seoDescription,
      seo_keywords: site.seoKeywords,
      canonical_base_url: site.canonicalBaseUrl,
      robots_index: site.robotsIndex,
      contact_email: site.contactEmail,
      contact_phone: site.contactPhone,
      address: site.address,
      kakao_channel_url: site.kakaoChannelUrl,
      naver_map_url: site.naverMapUrl,
      instagram_url: site.instagramUrl,
      business_number: site.businessNumber,
      business_name: site.businessName,
      representative_name: site.representativeName,
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
    if (dto.logo_image_url !== undefined) site.logoImageUrl = dto.logo_image_url;
    if (dto.favicon_url !== undefined) site.faviconUrl = dto.favicon_url;
    if (dto.og_image_url !== undefined) site.ogImageUrl = dto.og_image_url;
    if (dto.seo_title !== undefined) site.seoTitle = dto.seo_title;
    if (dto.seo_description !== undefined) site.seoDescription = dto.seo_description;
    if (dto.seo_keywords !== undefined) site.seoKeywords = dto.seo_keywords;
    if (dto.canonical_base_url !== undefined) site.canonicalBaseUrl = dto.canonical_base_url;
    if (dto.robots_index !== undefined) site.robotsIndex = dto.robots_index;
    if (dto.contact_email !== undefined) site.contactEmail = dto.contact_email;
    if (dto.contact_phone !== undefined) site.contactPhone = dto.contact_phone;
    if (dto.address !== undefined) site.address = dto.address;
    if (dto.kakao_channel_url !== undefined) site.kakaoChannelUrl = dto.kakao_channel_url;
    if (dto.naver_map_url !== undefined) site.naverMapUrl = dto.naver_map_url;
    if (dto.instagram_url !== undefined) site.instagramUrl = dto.instagram_url;
    if (dto.business_number !== undefined) site.businessNumber = dto.business_number;
    if (dto.business_name !== undefined) site.businessName = dto.business_name;
    if (dto.representative_name !== undefined) site.representativeName = dto.representative_name;

    const updated = await this.siteRepository.save(site);
    this.logger.log(`Updated site settings: ${updated.id}`);
    return this.toSettingsResponsePublic(updated);
  }
}
