import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Site } from '../../site/entities/site.entity';

/**
 * Request에서 tenant(Site) 정보를 가져오는 데코레이터
 * TenantGuard와 함께 사용해야 함
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof Site | undefined, ctx: ExecutionContext): Site[keyof Site] | Site | null => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as Site | null;

    if (!tenant) {
      return null;
    }

    return data ? tenant[data] : tenant;
  },
);
