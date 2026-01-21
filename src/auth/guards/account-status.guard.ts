import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AccountStatus } from '../entities/user.entity';
import { BusinessException } from '../../common/exception/business.exception';
import { ErrorCode } from '../../common/exception/error-code';

/**
 * 계정 상태 검증 Guard
 * ONBOARDING, ACTIVE 상태만 접근 허용
 * SUSPENDED, WITHDRAWN 상태는 차단
 *
 * @Public() 데코레이터가 있거나 인증되지 않은 요청은 건너뜀
 */
@Injectable()
export class AccountStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있으면 건너뜀
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 인증되지 않은 요청은 건너뜀 (JwtAuthGuard가 처리)
    if (!user?.userId) {
      return true;
    }

    // 사용자의 현재 계정 상태 조회
    const dbUser = await this.userRepository.findOne({
      where: { id: user.userId },
      select: ['id', 'accountStatus'],
    });

    if (!dbUser) {
      throw BusinessException.fromErrorCode(ErrorCode.USER_NOT_FOUND);
    }

    // 허용된 상태인지 확인
    const allowedStatuses: AccountStatus[] = [AccountStatus.ONBOARDING, AccountStatus.ACTIVE];

    if (!allowedStatuses.includes(dbUser.accountStatus)) {
      // 상태에 따른 에러 코드 반환
      if (dbUser.accountStatus === AccountStatus.SUSPENDED) {
        throw BusinessException.fromErrorCode(ErrorCode.ACCOUNT_SUSPENDED);
      }
      if (dbUser.accountStatus === AccountStatus.WITHDRAWN) {
        throw BusinessException.fromErrorCode(ErrorCode.ACCOUNT_WITHDRAWN);
      }
      // 기타 알 수 없는 상태
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_FORBIDDEN);
    }

    return true;
  }
}
