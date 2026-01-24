# Post 모듈

게시글 CRUD를 담당합니다.

## 주요 구성요소

### Entity

- `Post` - 게시글 (title, subtitle, slug, content, status 등)

### 상태 값

```typescript
PostStatus.PRIVATE    // 비공개 (새 글 또는 비공개 전환)
PostStatus.PUBLISHED  // 공개
```

### 컨텐츠 필드

- `content` - Deprecated, 하위 호환성용
- `contentJson` - Tiptap 에디터 JSON
- `contentHtml` - 렌더링용 HTML
- `contentText` - 검색/미리보기용 텍스트

## Controllers

### AdminPostController

```
POST   /admin/sites/:siteId/posts           - 게시글 생성
GET    /admin/sites/:siteId/posts           - 목록 조회
GET    /admin/sites/:siteId/posts/:id       - 상세 조회
PATCH  /admin/sites/:siteId/posts/:id       - 수정
DELETE /admin/sites/:siteId/posts/:id       - 삭제
GET    /admin/sites/:siteId/posts/check-slug - slug 중복 확인
```

### PublicPostController

```
GET /public/posts?siteSlug=xxx              - 공개 게시글 목록
GET /public/posts/:slug?siteSlug=xxx        - 공개 게시글 상세
```

### OnboardingPostController

온보딩 시 첫 글 작성용 엔드포인트

## 관계

- `Post` → `Site` (N:1)
- `Post` → `User` (N:1)
- `Post` → `Category` (N:1, optional)
- `Post` ← `PostImage` (1:N, storage 모듈)

## 주의사항

- slug는 사이트 내에서 unique
- 삭제 시 연결된 이미지는 postId를 null로 설정 (cleanup 대상)
- Public API는 PUBLISHED 상태만 조회
