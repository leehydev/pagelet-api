import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageView } from './entities/page-view.entity';
import { CtaClick } from './entities/cta-click.entity';
import { TrackPageviewDto } from './dto/track-pageview.dto';
import { TrackCtaClickDto } from './dto/track-cta-click.dto';
import { RedisService } from '../common/redis/redis.service';

/**
 * 중복 방지 TTL (초 단위)
 * 같은 visitorId가 같은 페이지를 5분 이내 재조회 시 중복 기록하지 않음
 */
const DEDUP_TTL_SECONDS = 5 * 60; // 5분

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(PageView)
    private readonly pageViewRepository: Repository<PageView>,
    @InjectRepository(CtaClick)
    private readonly ctaClickRepository: Repository<CtaClick>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 페이지뷰 기록
   * 중복 방지: 같은 visitorId가 같은 페이지를 5분 이내 재조회 시 중복 기록하지 않음
   */
  async trackPageview(dto: TrackPageviewDto): Promise<{ tracked: boolean }> {
    const dedupKey = this.buildPageviewDedupKey(dto.siteId, dto.postId ?? 'main', dto.visitorId);

    const isDuplicate = await this.checkAndSetDedup(dedupKey);
    if (isDuplicate) {
      this.logger.debug(`Duplicate pageview skipped: ${dedupKey}`);
      return { tracked: false };
    }

    const pageView = this.pageViewRepository.create({
      siteId: dto.siteId,
      postId: dto.postId ?? null,
      visitorId: dto.visitorId,
    });

    await this.pageViewRepository.save(pageView);
    this.logger.debug(`Pageview tracked: siteId=${dto.siteId}, postId=${dto.postId ?? 'main'}`);

    return { tracked: true };
  }

  /**
   * CTA 클릭 기록
   * 중복 방지: 같은 visitorId가 같은 페이지에서 5분 이내 재클릭 시 중복 기록하지 않음
   */
  async trackCtaClick(dto: TrackCtaClickDto): Promise<{ tracked: boolean }> {
    const dedupKey = this.buildCtaClickDedupKey(dto.siteId, dto.postId ?? 'main', dto.visitorId);

    const isDuplicate = await this.checkAndSetDedup(dedupKey);
    if (isDuplicate) {
      this.logger.debug(`Duplicate CTA click skipped: ${dedupKey}`);
      return { tracked: false };
    }

    const ctaClick = this.ctaClickRepository.create({
      siteId: dto.siteId,
      postId: dto.postId ?? null,
      visitorId: dto.visitorId,
    });

    await this.ctaClickRepository.save(ctaClick);
    this.logger.debug(`CTA click tracked: siteId=${dto.siteId}, postId=${dto.postId ?? 'main'}`);

    return { tracked: true };
  }

  /**
   * 중복 체크 및 키 설정
   * @returns true if duplicate (key already exists), false if new
   */
  private async checkAndSetDedup(key: string): Promise<boolean> {
    const client = this.redisService.getClient();

    // SET NX: key가 존재하지 않을 때만 설정
    const result = await client.set(key, '1', 'EX', DEDUP_TTL_SECONDS, 'NX');

    // result가 null이면 key가 이미 존재 (중복)
    return result === null;
  }

  /**
   * 페이지뷰 중복 방지 키 생성
   */
  private buildPageviewDedupKey(siteId: string, postId: string, visitorId: string): string {
    return `analytics:pageview:${siteId}:${postId}:${visitorId}`;
  }

  /**
   * CTA 클릭 중복 방지 키 생성
   */
  private buildCtaClickDedupKey(siteId: string, postId: string, visitorId: string): string {
    return `analytics:cta:${siteId}:${postId}:${visitorId}`;
  }
}
