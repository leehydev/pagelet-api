# Banner 모듈

사이트 배너 관리를 담당합니다. 게시글 기반 배너로 운영됩니다.

## 주요 구성요소

### Entity

- `SiteBanner` - 배너 (postId, isActive, displayOrder 등)

### 주요 필드

```typescript
siteId: string          // 소속 사이트
postId: string          // 연결된 게시글 (FK → posts.id)
isActive: boolean       // 활성화 상태
startAt: Date | null    // 노출 시작 시간
endAt: Date | null      // 노출 종료 시간
displayOrder: number    // 표시 순서
```

## Controllers

### AdminBannerController

```
POST   /admin/sites/:siteId/banners          - 배너 생성 (postId 필수)
GET    /admin/sites/:siteId/banners          - 배너 목록
GET    /admin/sites/:siteId/banners/:id      - 배너 상세
PUT    /admin/sites/:siteId/banners/:id      - 배너 수정
DELETE /admin/sites/:siteId/banners/:id      - 배너 삭제
PUT    /admin/sites/:siteId/banners/order    - 순서 변경
```

### PublicBannerController

```
GET /public/banners?siteSlug=xxx  - 활성 배너 조회
```

### 게시글 검색 API (Post 모듈)

```
GET /admin/sites/:siteId/posts/search?q=검색어&limit=10  - 게시글 검색 (오토컴플리트용)
```

## 관계

- `SiteBanner` -> `Site` (N:1)
- `SiteBanner` -> `Post` (N:1, CASCADE 삭제)

## 제약사항

- 배너 최대 5개
- PUBLISHED 상태의 게시글만 배너로 등록 가능
- 같은 게시글 중복 등록 불가
- 게시글 삭제 시 연결된 배너도 CASCADE 삭제

## Public API 필터링

활성 배너 조회 시 다음 조건이 적용됩니다:
- `isActive = true`
- `startAt IS NULL OR startAt <= now()`
- `endAt IS NULL OR endAt >= now()`
- `post.status = 'PUBLISHED'`

## 응답 DTO

### BannerResponseDto (Admin)
```typescript
{
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

### PublicBannerResponseDto (Public)
```typescript
{
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

## 주의사항

- displayOrder가 지정되지 않으면 자동으로 마지막 순서 + 1
- Site 삭제 시 배너도 CASCADE 삭제
- Post 삭제 시 배너도 CASCADE 삭제
