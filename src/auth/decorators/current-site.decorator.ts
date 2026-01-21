import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Site } from '../../site/entities/site.entity';

/**
 * Request에서 Site 정보를 가져오는 데코레이터
 * SiteGuard 또는 PublicSiteGuard와 함께 사용해야 함
 */
export const CurrentSite = createParamDecorator(
  (data: keyof Site | undefined, ctx: ExecutionContext): Site[keyof Site] | Site | null => {
    const request = ctx.switchToHttp().getRequest();
    const site = request.site as Site | null;

    if (!site) {
      return null;
    }

    return data ? site[data] : site;
  },
);
