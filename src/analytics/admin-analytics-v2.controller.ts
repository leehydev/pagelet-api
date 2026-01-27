import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { AdminSiteHeaderGuard } from '../auth/guards/admin-site-header.guard';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { Site } from '../site/entities/site.entity';
import { Post } from '../post/entities/post.entity';
import { AnalyticsOverviewDto } from './dto/analytics-overview.dto';
import { PostAnalyticsDto } from './dto/post-analytics.dto';
import { DailyAnalyticsDto } from './dto/daily-analytics.dto';

/**
 * AdminAnalyticsV2Controller
 * X-Site-Id 헤더 기반 인증을 사용하는 v2 컨트롤러
 * URL에서 siteId가 제거되고 헤더로 전달됨
 */
@ApiTags('Admin Analytics V2')
@Controller('admin/v2/analytics')
@UseGuards(AdminSiteHeaderGuard)
export class AdminAnalyticsV2Controller {
  constructor(
    private readonly analyticsService: AnalyticsService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * GET /admin/v2/analytics/overview
   * 사이트 통계 요약 조회
   * Header: X-Site-Id: {siteId}
   */
  @Get('overview')
  @ApiOperation({ summary: '사이트 통계 요약 조회' })
  @ApiResponse({
    status: 200,
    description: '총 조회수, 고유 방문자, 오늘/어제 방문자, CTA 클릭 수',
    type: AnalyticsOverviewDto,
  })
  async getOverview(@CurrentSite() site: Site): Promise<AnalyticsOverviewDto> {
    return this.analyticsService.getOverview(site.id);
  }

  /**
   * GET /admin/v2/analytics/posts
   * 게시글별 통계 조회
   * Header: X-Site-Id: {siteId}
   */
  @Get('posts')
  @ApiOperation({ summary: '게시글별 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '게시글별 조회수, 고유 방문자, CTA 클릭 수',
    type: [PostAnalyticsDto],
  })
  async getPostsAnalytics(@CurrentSite() site: Site): Promise<PostAnalyticsDto[]> {
    return this.analyticsService.getPostsAnalytics(site.id, this.postRepository);
  }

  /**
   * GET /admin/v2/analytics/daily?days=7
   * 일별 통계 추이 조회
   * Header: X-Site-Id: {siteId}
   */
  @Get('daily')
  @ApiOperation({ summary: '일별 통계 추이 조회' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: '조회할 일수 (기본값: 7, 최대: 90)',
  })
  @ApiResponse({
    status: 200,
    description: '일별 조회수, 방문자 수, CTA 클릭 수',
    type: [DailyAnalyticsDto],
  })
  async getDailyAnalytics(
    @CurrentSite() site: Site,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ): Promise<DailyAnalyticsDto[]> {
    // 최대 90일로 제한
    const limitedDays = Math.min(Math.max(days, 1), 90);
    return this.analyticsService.getDailyAnalytics(site.id, limitedDays);
  }
}
