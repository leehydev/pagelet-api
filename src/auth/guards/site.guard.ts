import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SiteService } from '../../site/site.service';

/**
 * SiteGuard
 * 현재 로그인한 사용자의 Site를 조회하여 request.site에 저장
 * JwtAuthGuard 이후에 실행되어야 함
 */
@Injectable()
export class SiteGuard implements CanActivate {
  constructor(private readonly siteService: SiteService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      request.site = null;
      return true; // Guard는 통과, site는 null
    }

    const site = await this.siteService.findByUserId(user.userId);
    request.site = site;

    return true;
  }
}
