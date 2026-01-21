import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { SiteService } from '../../site/site.service';

/**
 * PublicSiteGuard
 * Host 헤더 기반으로 Site를 resolve하여 request.site에 저장
 *
 * Host 형식: {slug}.pagelet-dev.kr 또는 {slug}.localhost:3000
 * 또는 X-Site-Slug 헤더로 직접 전달
 */
@Injectable()
export class PublicSiteGuard implements CanActivate {
  constructor(private readonly siteService: SiteService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. X-Site-Slug 헤더 우선 확인 (개발/테스트 용이)
    let slug = request.headers['x-site-slug'] as string;

    // 2. Host 헤더에서 slug 추출
    if (!slug) {
      const host = request.headers.host || '';
      slug = this.extractSlugFromHost(host) ?? '';
    }

    if (!slug) {
      throw new NotFoundException('사이트를 찾을 수 없습니다. 올바른 도메인으로 접근해주세요.');
    }

    const site = await this.siteService.findBySlug(slug);
    if (!site) {
      throw new NotFoundException(`사이트를 찾을 수 없습니다: ${slug}`);
    }

    request.site = site;
    return true;
  }

  /**
   * Host에서 slug 추출
   * 예: "mysite.pagelet-dev.kr" → "mysite"
   * 예: "mysite.localhost:3000" → "mysite"
   */
  private extractSlugFromHost(host: string): string | null {
    // 포트 제거
    const hostWithoutPort = host.split(':')[0];

    // 서브도메인 추출 (첫 번째 점 앞부분)
    const parts = hostWithoutPort.split('.');

    if (parts.length >= 2) {
      const slug = parts[0];
      // www, api 등 예약어 제외
      if (slug && slug !== 'www' && slug !== 'api' && slug !== 'admin') {
        return slug;
      }
    }

    return null;
  }
}
