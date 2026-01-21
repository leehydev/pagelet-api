import { Controller, Get, Put, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { SiteService } from './site.service';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { SiteGuard } from '../auth/guards/site.guard';
import { UpdateSiteSettingsDto, SiteSettingsResponseDto } from './dto';
import { Site } from './entities/site.entity';

@Controller('site-settings')
@UseGuards(SiteGuard)
export class SiteSettingsController {
  constructor(private readonly siteService: SiteService) {}

  /**
   * GET /site-settings
   * 현재 사이트 설정 조회
   * Site가 없으면 null 반환 (FE에서 생성 플로우 유도)
   */
  @Get()
  async getSettings(
    @CurrentSite() site: Site | null,
  ): Promise<SiteSettingsResponseDto | null> {
    if (!site) {
      return null;
    }
    return this.siteService.toSettingsResponsePublic(site);
  }

  /**
   * PUT /site-settings
   * 현재 사이트 설정 수정
   */
  @Put()
  async updateSettings(
    @CurrentSite() site: Site | null,
    @Body() dto: UpdateSiteSettingsDto,
  ): Promise<SiteSettingsResponseDto> {
    if (!site) {
      throw new NotFoundException('사이트가 존재하지 않습니다. 먼저 사이트를 생성해주세요.');
    }
    return this.siteService.updateSettings(site.id, dto);
  }
}
