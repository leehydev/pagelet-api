import { SetMetadata } from '@nestjs/common';

/**
 * AllowPending 데코레이터
 * PENDING 상태의 사용자도 접근 허용이 필요한 엔드포인트에 사용
 * (예: /auth/me - 사용자가 자신의 상태를 확인할 수 있어야 함)
 */
export const AllowPending = () => SetMetadata('allowPending', true);
