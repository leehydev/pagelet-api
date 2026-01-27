import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SiteService } from '../../site/site.service';
import { BusinessException } from '../../common/exception/business.exception';
import { ErrorCode } from '../../common/exception/error-code';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * AdminSiteHeaderGuard
 * X-Site-Id 헤더를 기반으로 사이트 접근 권한을 검증
 * - 헤더에서 X-Site-Id 추출
 * - 해당 사이트가 현재 사용자의 소유인지 확인
 * - 검증 통과 시 request.site에 저장
 */
@Injectable()
export class AdminSiteHeaderGuard implements CanActivate {
  constructor(private readonly siteService: SiteService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const siteId = request.headers['x-site-id'];

    if (!siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_HEADER_MISSING);
    }

    if (!UUID_REGEX.test(siteId)) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        '유효하지 않은 사이트 ID 형식입니다',
      );
    }

    if (!user?.userId) {
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_UNAUTHORIZED, '인증이 필요합니다');
    }

    const site = await this.siteService.findById(siteId);

    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    if (site.userId !== user.userId) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_FORBIDDEN,
        '해당 사이트에 대한 접근 권한이 없습니다',
      );
    }

    request.site = site;
    return true;
  }
}
