import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SiteService } from './site.service';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { AdminSiteGuard } from '../auth/guards/admin-site.guard';
import { UpdateSiteSettingsDto, SiteSettingsResponseDto } from './dto';
import { Site } from './entities/site.entity';

@Controller('admin/sites/:siteId/settings')
@UseGuards(AdminSiteGuard)
export class AdminSiteSettingsController {
  constructor(private readonly siteService: SiteService) {}

  /**
   * GET /admin/sites/:siteId/settings
   * 사이트 설정 조회
   */
  @Get()
  async getSettings(@CurrentSite() site: Site): Promise<SiteSettingsResponseDto> {
    return this.siteService.toSettingsResponse(site);
  }

  /**
   * PUT /admin/sites/:siteId/settings
   * 사이트 설정 수정
   */
  @Put()
  async updateSettings(
    @CurrentSite() site: Site,
    @Body() dto: UpdateSiteSettingsDto,
  ): Promise<SiteSettingsResponseDto> {
    return this.siteService.updateSettings(site.id, dto);
  }
}
