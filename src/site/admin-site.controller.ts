import { Controller, Get } from '@nestjs/common';
import { SiteService } from './site.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';
import { AdminSiteListResponseDto } from './dto/admin-site-list.dto';

@Controller('admin/sites')
export class AdminSiteController {
  constructor(private readonly siteService: SiteService) {}

  /**
   * GET /admin/sites
   * 현재 사용자의 사이트 목록 조회
   */
  @Get()
  async getMySites(@CurrentUser() user: UserPrincipal): Promise<AdminSiteListResponseDto[]> {
    const sites = await this.siteService.findAllByUserId(user.userId);
    return sites.map(
      (site) =>
        new AdminSiteListResponseDto({
          id: site.id,
          name: site.name,
          slug: site.slug,
        }),
    );
  }
}
