import { Controller, Post, Body } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackPageviewDto } from './dto/track-pageview.dto';
import { TrackCtaClickDto } from './dto/track-cta-click.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public/analytics')
@Public()
export class PublicAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * POST /public/analytics/pageview
   * 페이지뷰 추적
   */
  @Post('pageview')
  async trackPageview(@Body() dto: TrackPageviewDto): Promise<{ tracked: boolean }> {
    return this.analyticsService.trackPageview(dto);
  }

  /**
   * POST /public/analytics/cta-click
   * CTA 클릭 추적
   */
  @Post('cta-click')
  async trackCtaClick(@Body() dto: TrackCtaClickDto): Promise<{ tracked: boolean }> {
    return this.analyticsService.trackCtaClick(dto);
  }
}
