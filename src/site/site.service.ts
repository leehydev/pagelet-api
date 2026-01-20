import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';

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
      user_id: userId,
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
    return this.siteRepository.findOne({ where: { user_id: userId } });
  }

  /**
   * 예약어 목록 반환
   */
  getReservedSlugs(): string[] {
    return Array.from(RESERVED_SLUGS);
  }
}
