import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SiteService } from '../../site/site.service';

/**
 * TenantGuard
 * 현재 로그인한 사용자의 Site를 조회하여 request.tenant에 저장
 * JwtAuthGuard 이후에 실행되어야 함
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly siteService: SiteService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      request.tenant = null;
      return true; // Guard는 통과, tenant는 null
    }

    const site = await this.siteService.findByUserId(user.userId);
    request.tenant = site;

    return true;
  }
}
