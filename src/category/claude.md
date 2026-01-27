# Category 모듈

게시글 카테고리 관리를 담당합니다.

## 주요 구성요소

### Entity

- `Category` - 카테고리 (name, slug, description, sortOrder)

### 주요 필드

```typescript
siteId: string; // 소속 사이트
slug: string; // URL 슬러그 (사이트 내 unique)
name: string; // 카테고리 이름
description: string; // 설명 (optional)
sortOrder: number; // 정렬 순서
```

## Controllers

### AdminCategoryController

```
POST   /admin/sites/:siteId/categories      - 카테고리 생성
GET    /admin/sites/:siteId/categories      - 목록 조회
PATCH  /admin/sites/:siteId/categories/:id  - 수정
DELETE /admin/sites/:siteId/categories/:id  - 삭제
```

### PublicCategoryController

```
GET /public/categories?siteSlug=xxx         - 공개 카테고리 목록
```

## 관계

- `Category` → `Site` (N:1)
- `Category` ← `Post` (1:N)

## 예약된 slug

일부 slug는 시스템에서 예약되어 사용 불가:

- `all`, `uncategorized` 등

## 주의사항

- slug는 사이트 내에서 unique
- 게시글이 있는 카테고리 삭제 시 CATEGORY_HAS_POSTS 에러
- 삭제 시 연결된 게시글의 categoryId는 null로 설정됨 (onDelete: SET NULL)
