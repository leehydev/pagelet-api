import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SiteService } from '../../site/site.service';

/**
 * AdminSiteGuard
 * URL 파라미터의 siteId를 기반으로 사이트 접근 권한을 검증
 * - URL에서 :siteId 추출
 * - 해당 사이트가 현재 사용자의 소유인지 확인
 * - 검증 통과 시 request.site에 저장
 */
@Injectable()
export class AdminSiteGuard implements CanActivate {
  constructor(private readonly siteService: SiteService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const siteId = request.params.siteId;

    if (!siteId) {
      throw new NotFoundException('siteId가 필요합니다.');
    }

    if (!user?.userId) {
      throw new ForbiddenException('인증이 필요합니다.');
    }

    // siteId로 사이트 조회
    const site = await this.siteService.findById(siteId);

    if (!site) {
      throw new NotFoundException('사이트를 찾을 수 없습니다.');
    }

    // 사용자의 사이트인지 확인
    if (site.userId !== user.userId) {
      throw new ForbiddenException('해당 사이트에 대한 접근 권한이 없습니다.');
    }

    request.site = site;
    return true;
  }
}
