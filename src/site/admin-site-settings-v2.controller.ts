import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SiteService } from './site.service';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { AdminSiteHeaderGuard } from '../auth/guards/admin-site-header.guard';
import { UpdateSiteSettingsDto, SiteSettingsResponseDto } from './dto';
import { Site } from './entities/site.entity';

/**
 * AdminSiteSettingsV2Controller
 * X-Site-Id 헤더 기반 인증을 사용하는 v2 컨트롤러
 * URL에서 siteId가 제거되고 헤더로 전달됨
 */
@Controller('admin/v2/settings')
@UseGuards(AdminSiteHeaderGuard)
export class AdminSiteSettingsV2Controller {
  constructor(private readonly siteService: SiteService) {}

  /**
   * GET /admin/v2/settings
   * 사이트 설정 조회
   * Header: X-Site-Id: {siteId}
   */
  @Get()
  async getSettings(@CurrentSite() site: Site): Promise<SiteSettingsResponseDto> {
    return this.siteService.toSettingsResponse(site);
  }

  /**
   * PUT /admin/v2/settings
   * 사이트 설정 수정
   * Header: X-Site-Id: {siteId}
   */
  @Put()
  async updateSettings(
    @CurrentSite() site: Site,
    @Body() dto: UpdateSiteSettingsDto,
  ): Promise<SiteSettingsResponseDto> {
    return this.siteService.updateSettings(site.id, dto);
  }
}
