import { Controller, Get, Query } from '@nestjs/common';
import { SiteService } from './site.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('sites')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  /**
   * GET /sites/check-slug
   * slug 사용 가능 여부 확인
   */
  @Public()
  @Get('check-slug')
  async checkSlug(
    @Query('slug') slug: string,
  ): Promise<{ available: boolean; message?: string }> {
    if (!slug) {
      return { available: false, message: 'slug is required' };
    }

    const available = await this.siteService.isSlugAvailable(slug);
    return { available };
  }

  /**
   * GET /sites/reserved-slugs
   * 예약어 목록 조회
   */
  @Public()
  @Get('reserved-slugs')
  getReservedSlugs(): { slugs: string[] } {
    return { slugs: this.siteService.getReservedSlugs() };
  }
}
