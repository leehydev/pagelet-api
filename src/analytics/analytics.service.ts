import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageView } from './entities/page-view.entity';
import { CtaClick } from './entities/cta-click.entity';
import { TrackPageviewDto } from './dto/track-pageview.dto';
import { TrackCtaClickDto } from './dto/track-cta-click.dto';
import { RedisService } from '../common/redis/redis.service';
import { AnalyticsOverviewDto } from './dto/analytics-overview.dto';
import { PostAnalyticsDto } from './dto/post-analytics.dto';
import { DailyAnalyticsDto } from './dto/daily-analytics.dto';
import { Post } from '../post/entities/post.entity';

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

  /**
   * 사이트 통계 요약 조회
   */
  async getOverview(siteId: string): Promise<AnalyticsOverviewDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // 총 조회수
    const totalViews = await this.pageViewRepository.count({
      where: { siteId },
    });

    // 고유 방문자 수
    const uniqueVisitorsResult = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('COUNT(DISTINCT pv.visitor_id)', 'count')
      .where('pv.site_id = :siteId', { siteId })
      .getRawOne();
    const uniqueVisitors = parseInt(uniqueVisitorsResult?.count ?? '0', 10);

    // 오늘 방문자 수
    const todayVisitorsResult = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('COUNT(DISTINCT pv.visitor_id)', 'count')
      .where('pv.site_id = :siteId', { siteId })
      .andWhere('pv.viewed_at >= :todayStart', { todayStart })
      .getRawOne();
    const todayVisitors = parseInt(todayVisitorsResult?.count ?? '0', 10);

    // 어제 방문자 수
    const yesterdayVisitorsResult = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('COUNT(DISTINCT pv.visitor_id)', 'count')
      .where('pv.site_id = :siteId', { siteId })
      .andWhere('pv.viewed_at >= :yesterdayStart', { yesterdayStart })
      .andWhere('pv.viewed_at < :todayStart', { todayStart })
      .getRawOne();
    const yesterdayVisitors = parseInt(yesterdayVisitorsResult?.count ?? '0', 10);

    // 총 CTA 클릭 수
    const totalCtaClicks = await this.ctaClickRepository.count({
      where: { siteId },
    });

    // 오늘 CTA 클릭 수
    const todayCtaClicksResult = await this.ctaClickRepository
      .createQueryBuilder('cc')
      .select('COUNT(*)', 'count')
      .where('cc.site_id = :siteId', { siteId })
      .andWhere('cc.clicked_at >= :todayStart', { todayStart })
      .getRawOne();
    const todayCtaClicks = parseInt(todayCtaClicksResult?.count ?? '0', 10);

    return new AnalyticsOverviewDto({
      totalViews,
      uniqueVisitors,
      todayVisitors,
      yesterdayVisitors,
      totalCtaClicks,
      todayCtaClicks,
    });
  }

  /**
   * 게시글별 통계 조회
   */
  async getPostsAnalytics(
    siteId: string,
    postRepository: Repository<Post>,
  ): Promise<PostAnalyticsDto[]> {
    const results = await postRepository
      .createQueryBuilder('p')
      .select('p.id', 'postId')
      .addSelect('p.title', 'title')
      .addSelect('COALESCE(pv_stats.views, 0)', 'views')
      .addSelect('COALESCE(pv_stats.visitors, 0)', 'uniqueVisitors')
      .addSelect('COALESCE(cc_stats.clicks, 0)', 'ctaClicks')
      .leftJoin(
        (qb) =>
          qb
            .select('pv.post_id', 'post_id')
            .addSelect('COUNT(*)', 'views')
            .addSelect('COUNT(DISTINCT pv.visitor_id)', 'visitors')
            .from(PageView, 'pv')
            .where('pv.site_id = :siteId', { siteId })
            .andWhere('pv.post_id IS NOT NULL')
            .groupBy('pv.post_id'),
        'pv_stats',
        'pv_stats.post_id = p.id',
      )
      .leftJoin(
        (qb) =>
          qb
            .select('cc.post_id', 'post_id')
            .addSelect('COUNT(*)', 'clicks')
            .from(CtaClick, 'cc')
            .where('cc.site_id = :siteId', { siteId })
            .andWhere('cc.post_id IS NOT NULL')
            .groupBy('cc.post_id'),
        'cc_stats',
        'cc_stats.post_id = p.id',
      )
      .where('p.site_id = :siteId', { siteId })
      .orderBy('views', 'DESC')
      .getRawMany();

    return results.map(
      (row) =>
        new PostAnalyticsDto({
          postId: row.postId,
          title: row.title,
          views: parseInt(row.views, 10),
          uniqueVisitors: parseInt(row.uniqueVisitors, 10),
          ctaClicks: parseInt(row.ctaClicks, 10),
        }),
    );
  }

  /**
   * 일별 통계 추이 조회
   */
  async getDailyAnalytics(siteId: string, days: number = 7): Promise<DailyAnalyticsDto[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // 페이지뷰 일별 통계
    const pageViewStats = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select("TO_CHAR(pv.viewed_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'views')
      .addSelect('COUNT(DISTINCT pv.visitor_id)', 'visitors')
      .where('pv.site_id = :siteId', { siteId })
      .andWhere('pv.viewed_at >= :startDate', { startDate })
      .groupBy("TO_CHAR(pv.viewed_at, 'YYYY-MM-DD')")
      .getRawMany();

    // CTA 클릭 일별 통계
    const ctaClickStats = await this.ctaClickRepository
      .createQueryBuilder('cc')
      .select("TO_CHAR(cc.clicked_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'clicks')
      .where('cc.site_id = :siteId', { siteId })
      .andWhere('cc.clicked_at >= :startDate', { startDate })
      .groupBy("TO_CHAR(cc.clicked_at, 'YYYY-MM-DD')")
      .getRawMany();

    // 날짜별로 데이터 병합
    const statsMap = new Map<string, { views: number; visitors: number; ctaClicks: number }>();

    // 모든 날짜에 대해 기본값 설정
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      statsMap.set(dateStr, { views: 0, visitors: 0, ctaClicks: 0 });
    }

    // 페이지뷰 통계 병합
    for (const row of pageViewStats) {
      const existing = statsMap.get(row.date);
      if (existing) {
        existing.views = parseInt(row.views, 10);
        existing.visitors = parseInt(row.visitors, 10);
      }
    }

    // CTA 클릭 통계 병합
    for (const row of ctaClickStats) {
      const existing = statsMap.get(row.date);
      if (existing) {
        existing.ctaClicks = parseInt(row.clicks, 10);
      }
    }

    // 날짜순으로 정렬하여 반환
    const sortedDates = Array.from(statsMap.keys()).sort();
    return sortedDates.map(
      (date) =>
        new DailyAnalyticsDto({
          date,
          views: statsMap.get(date)!.views,
          visitors: statsMap.get(date)!.visitors,
          ctaClicks: statsMap.get(date)!.ctaClicks,
        }),
    );
  }
}
