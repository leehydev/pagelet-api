import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPrincipal } from '../types/jwt-payload.interface';

/**
 * @CurrentUser() 데코레이터
 * 컨트롤러에서 현재 인증된 사용자 정보를 주입받을 수 있음
 *
 * 사용 예시:
 * @Get('profile')
 * getProfile(@CurrentUser() user: UserPrincipal) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPrincipal => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
