import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../common/exception/business.exception';
import { ErrorCode } from '../../common/exception/error-code';

/**
 * 슈퍼 관리자 Guard
 * 환경변수 SUPERADMIN_USER_IDS에 지정된 사용자만 접근 허용
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly superAdminUserIds: Set<string>;

  constructor(private readonly configService: ConfigService) {
    const userIdsString = this.configService.get<string>('SUPERADMIN_USER_IDS', '');
    this.superAdminUserIds = new Set(
      userIdsString
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_UNAUTHORIZED);
    }

    if (!this.superAdminUserIds.has(user.userId)) {
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_FORBIDDEN);
    }

    return true;
  }
}
