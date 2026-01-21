import { Controller, Get, UseGuards, Header } from '@nestjs/common';
import { SiteService } from './site.service';
import { PublicSiteGuard } from '../auth/guards/public-site.guard';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { PublicSiteSettingsResponseDto } from './dto';
import { Site } from './entities/site.entity';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public/site-settings')
@Public()
@UseGuards(PublicSiteGuard)
export class PublicSiteSettingsController {
  constructor(private readonly siteService: SiteService) {}

  /**
   * GET /public/site-settings
   * Host 기반 Site resolve 후 해당 site settings 반환
   *
   * 캐싱: Cache-Control 헤더 설정 (앱단 ISR과 함께 사용)
   */
  @Get()
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async getSettings(@CurrentSite() site: Site): Promise<PublicSiteSettingsResponseDto> {
    return this.siteService.toPublicSettingsResponse(site);
  }
}
