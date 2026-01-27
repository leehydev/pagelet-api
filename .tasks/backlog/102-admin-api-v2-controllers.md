# [BE] Admin API v2 컨트롤러 전체 마이그레이션

## GitHub 이슈

- **이슈 번호**: #102
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/102
- **우선순위**: 높음
- **선행 태스크**: #100 (X-Site-Id 헤더 인증 - 완료)
- **프론트엔드 의존**: leehydev/pagelet-app#104

## 의존성

- [x] #100 X-Site-Id 헤더 기반 인증 시스템

## 개요

모든 Admin API를 v2로 마이그레이션합니다.
v2 API는 URL 파라미터(`/admin/sites/:siteId/...`) 대신 `X-Site-Id` 헤더를 사용합니다.

### 배경
- v1: `/admin/sites/:siteId/posts` - URL에 siteId 포함
- v2: `/admin/v2/posts` + 헤더 `X-Site-Id: {uuid}`
- PoC 완료: Category v2 (`admin-category-v2.controller.ts`)

## 작업 범위

### 포함
- Posts v2 컨트롤러 추가
- Settings v2 컨트롤러 추가
- Uploads v2 컨트롤러 추가
- Branding v2 컨트롤러 추가
- Banners v2 컨트롤러 추가
- Analytics v2 컨트롤러 추가

### 제외
- v1 API 삭제 (하위 호환성 유지)
- Public API (변경 없음)

## 기술 명세

### 생성할 파일

| 파일 | 경로 |
|------|------|
| Posts v2 | `src/post/admin-post-v2.controller.ts` |
| Settings v2 | `src/site/admin-site-settings-v2.controller.ts` |
| Uploads v2 | `src/storage/admin-upload-v2.controller.ts` |
| Branding v2 | `src/storage/admin-branding-asset-v2.controller.ts` |
| Banners v2 | `src/banner/admin-banner-v2.controller.ts` |
| Analytics v2 | `src/analytics/admin-analytics-v2.controller.ts` |

### v2 컨트롤러 패턴

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminSiteHeaderGuard } from '../auth/guards/admin-site-header.guard';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { Site } from '../site/entities/site.entity';

@Controller('admin/v2/posts')
@UseGuards(AdminSiteHeaderGuard)
export class AdminPostV2Controller {
  @Get()
  async getPosts(@CurrentSite() site: Site) {
    // site.id 사용
  }
}
```

### 엔드포인트 매핑

#### Posts
| v1 | v2 |
|----|----|
| `GET /admin/sites/:siteId/posts` | `GET /admin/v2/posts` |
| `POST /admin/sites/:siteId/posts` | `POST /admin/v2/posts` |
| `GET /admin/sites/:siteId/posts/:postId` | `GET /admin/v2/posts/:postId` |
| `PATCH /admin/sites/:siteId/posts/:postId` | `PATCH /admin/v2/posts/:postId` |
| `DELETE /admin/sites/:siteId/posts/:postId` | `DELETE /admin/v2/posts/:postId` |
| `GET /admin/sites/:siteId/posts/check-slug` | `GET /admin/v2/posts/check-slug` |
| `GET /admin/sites/:siteId/posts/search` | `GET /admin/v2/posts/search` |
| `POST /admin/sites/:siteId/posts/:postId/publish` | `POST /admin/v2/posts/:postId/publish` |
| `POST /admin/sites/:siteId/posts/:postId/unpublish` | `POST /admin/v2/posts/:postId/unpublish` |
| `POST /admin/sites/:siteId/posts/:postId/republish` | `POST /admin/v2/posts/:postId/republish` |
| `GET /admin/sites/:siteId/posts/:postId/draft` | `GET /admin/v2/posts/:postId/draft` |
| `PUT /admin/sites/:siteId/posts/:postId/draft` | `PUT /admin/v2/posts/:postId/draft` |
| `DELETE /admin/sites/:siteId/posts/:postId/draft` | `DELETE /admin/v2/posts/:postId/draft` |

#### Settings
| v1 | v2 |
|----|----|
| `GET /admin/sites/:siteId/settings` | `GET /admin/v2/settings` |
| `PUT /admin/sites/:siteId/settings` | `PUT /admin/v2/settings` |

#### Uploads
| v1 | v2 |
|----|----|
| `POST /admin/sites/:siteId/uploads/presign` | `POST /admin/v2/uploads/presign` |
| `POST /admin/sites/:siteId/uploads/complete` | `POST /admin/v2/uploads/complete` |
| `POST /admin/sites/:siteId/uploads/abort` | `POST /admin/v2/uploads/abort` |

#### Branding
| v1 | v2 |
|----|----|
| `POST /admin/sites/:siteId/assets/branding/presign` | `POST /admin/v2/assets/branding/presign` |
| `POST /admin/sites/:siteId/assets/branding/commit` | `POST /admin/v2/assets/branding/commit` |
| `DELETE /admin/sites/:siteId/assets/branding/:type` | `DELETE /admin/v2/assets/branding/:type` |

#### Banners
| v1 | v2 |
|----|----|
| `GET /admin/sites/:siteId/banners` | `GET /admin/v2/banners` |
| `POST /admin/sites/:siteId/banners` | `POST /admin/v2/banners` |
| `GET /admin/sites/:siteId/banners/:id` | `GET /admin/v2/banners/:id` |
| `PUT /admin/sites/:siteId/banners/:id` | `PUT /admin/v2/banners/:id` |
| `DELETE /admin/sites/:siteId/banners/:id` | `DELETE /admin/v2/banners/:id` |
| `PUT /admin/sites/:siteId/banners/order` | `PUT /admin/v2/banners/order` |

#### Analytics
| v1 | v2 |
|----|----|
| `GET /admin/sites/:siteId/analytics/overview` | `GET /admin/v2/analytics/overview` |
| `GET /admin/sites/:siteId/analytics/posts` | `GET /admin/v2/analytics/posts` |
| `GET /admin/sites/:siteId/analytics/daily` | `GET /admin/v2/analytics/daily` |

## 구현 체크리스트

### Phase 1: Posts v2
- [ ] `admin-post-v2.controller.ts` 생성
- [ ] 모듈에 컨트롤러 등록
- [ ] 테스트

### Phase 2: Settings v2
- [ ] `admin-site-settings-v2.controller.ts` 생성
- [ ] 모듈에 컨트롤러 등록
- [ ] 테스트

### Phase 3: Uploads & Branding v2
- [ ] `admin-upload-v2.controller.ts` 생성
- [ ] `admin-branding-asset-v2.controller.ts` 생성
- [ ] 모듈에 컨트롤러 등록
- [ ] 테스트

### Phase 4: Banners v2
- [ ] `admin-banner-v2.controller.ts` 생성
- [ ] 모듈에 컨트롤러 등록
- [ ] 테스트

### Phase 5: Analytics v2
- [ ] `admin-analytics-v2.controller.ts` 생성
- [ ] 모듈에 컨트롤러 등록
- [ ] 테스트

## 테스트 계획

### API 테스트 (curl/Postman)
- [ ] 각 v2 엔드포인트 X-Site-Id 헤더로 호출
- [ ] 헤더 누락 시 400 에러 확인
- [ ] 권한 없는 사이트 접근 시 403 에러 확인

## 참고 자료

- PoC 컨트롤러: `src/category/admin-category-v2.controller.ts`
- Guard: `src/auth/guards/admin-site-header.guard.ts`
- Decorator: `src/auth/decorators/current-site.decorator.ts`
