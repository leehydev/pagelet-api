# [BE] 게시글 배너 API 리팩토링

## GitHub 이슈
- **이슈 번호**: #33
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/33
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-app#38 (프론트엔드)

## 개요

기존 이미지 기반 배너를 게시글 기반 배너로 리팩토링합니다.

### 변경 사항
- **기존**: 이미지 URL + 링크 URL + deviceType(desktop/mobile) 구분
- **변경**: 게시글 선택 → 제목 + 소제목 + OG 이미지 + 카테고리/작성일 표시

## 작업 범위

### 포함
- 게시글 검색 API (오토컴플리트용)
- SiteBanner 엔티티 스키마 변경
- 배너 CRUD API 수정
- Public 배너 조회 API 수정

### 제외
- 프론트엔드 구현 (별도 이슈)

## 기술 명세

### 1. 게시글 검색 API 추가

```
GET /admin/sites/:siteId/posts/search?q=검색어&limit=10
```

**응답 DTO:**
```typescript
class PostSearchResultDto {
  id: string;
  title: string;
  subtitle: string;
  ogImageUrl: string | null;
  categoryName: string | null;
  publishedAt: Date | null;
  status: string;
}
```

### 2. SiteBanner 엔티티 변경

**제거할 필드:**
- `imageUrl` (varchar 500)
- `linkUrl` (varchar 500, nullable)
- `openInNewTab` (boolean)
- `altText` (varchar 255, nullable)
- `deviceType` (varchar 20)

**추가할 필드:**
- `postId` (uuid, FK → posts.id)

**유지할 필드:**
- `id`, `siteId`, `isActive`, `startAt`, `endAt`, `displayOrder`, `createdAt`, `updatedAt`

### 3. DTO 변경

**CreateBannerDto → CreatePostBannerDto:**
```typescript
class CreatePostBannerDto {
  @IsUUID()
  postId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
```

**UpdateBannerDto:**
- postId 변경 가능
- isActive, startAt, endAt 변경 가능

**BannerResponseDto:**
```typescript
class BannerResponseDto {
  id: string;
  postId: string;
  post: {
    id: string;
    title: string;
    subtitle: string;
    slug: string;
    ogImageUrl: string | null;
    categoryId: string | null;
    categoryName: string | null;
    publishedAt: Date | null;
  };
  isActive: boolean;
  startAt: Date | null;
  endAt: Date | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. API 변경

**Admin API:**
```
POST   /admin/sites/:siteId/banners          - 배너 생성 (postId 필수)
GET    /admin/sites/:siteId/banners          - 배너 목록 (deviceType 파라미터 제거)
GET    /admin/sites/:siteId/banners/:id      - 배너 상세
PUT    /admin/sites/:siteId/banners/:id      - 배너 수정
DELETE /admin/sites/:siteId/banners/:id      - 배너 삭제
PUT    /admin/sites/:siteId/banners/order    - 순서 변경 (deviceType 파라미터 제거)
```

**제거할 API:**
- `POST /admin/sites/:siteId/banners/presign` (이미지 업로드 불필요)

**Public API:**
```
GET /public/banners?siteSlug=xxx  - 활성 배너 조회 (deviceType 파라미터 제거)
```

**Public 응답에 포함할 정보:**
```typescript
class PublicBannerResponseDto {
  id: string;
  post: {
    title: string;
    subtitle: string;
    slug: string;
    ogImageUrl: string | null;
    categoryName: string | null;
    publishedAt: Date | null;
  };
  displayOrder: number;
}
```

### 5. 마이그레이션

```sql
-- 기존 데이터가 없으므로 테이블 재생성
DROP TABLE IF EXISTS site_banners;

CREATE TABLE site_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_banners_site_id ON site_banners(site_id);
CREATE INDEX idx_site_banners_post_id ON site_banners(post_id);
```

### 6. 비즈니스 로직

- 배너 최대 5개 제한 (deviceType 구분 없이)
- 같은 게시글 중복 등록 불가
- PUBLISHED 상태의 게시글만 배너로 등록 가능
- 게시글 삭제 시 연결된 배너도 CASCADE 삭제

## 구현 체크리스트

- [ ] 게시글 검색 API 추가 (`GET /admin/sites/:siteId/posts/search`)
- [ ] 마이그레이션 작성 (site_banners 테이블 재생성)
- [ ] SiteBanner 엔티티 수정
- [ ] CreatePostBannerDto, UpdatePostBannerDto 작성
- [ ] BannerResponseDto, PublicBannerResponseDto 수정
- [ ] BannerService 수정
  - [ ] Post 검증 로직 추가
  - [ ] 중복 게시글 체크
  - [ ] deviceType 관련 로직 제거
- [ ] AdminBannerController 수정
  - [ ] presign 엔드포인트 제거
  - [ ] deviceType 파라미터 제거
- [ ] PublicBannerController 수정
- [ ] 기존 banner.module.ts 의존성 정리

## 테스트 계획

- [ ] 게시글 검색 API 테스트
- [ ] 배너 CRUD 테스트
- [ ] 배너 최대 개수 제한 테스트
- [ ] 중복 게시글 등록 방지 테스트
- [ ] Public API 필터링 테스트

## 영향받는 파일

- `src/post/admin-post.controller.ts` (검색 API 추가)
- `src/post/post.service.ts` (검색 메서드 추가)
- `src/post/dto/post-search-result.dto.ts` (신규)
- `src/banner/entities/site-banner.entity.ts`
- `src/banner/dto/create-banner.dto.ts`
- `src/banner/dto/update-banner.dto.ts`
- `src/banner/dto/banner-response.dto.ts`
- `src/banner/banner.service.ts`
- `src/banner/admin-banner.controller.ts`
- `src/banner/public-banner.controller.ts`
- `src/database/migrations/XXXXXX-RefactorSiteBannersToPostBanners.ts` (신규)
