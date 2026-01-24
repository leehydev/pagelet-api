# [BE] 공개 게시글 목록 페이징 및 카테고리별 인접 게시글 조회

## GitHub 이슈
- **이슈 번호**: #72
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/72
- **생성일**: 2026-01-25
- **우선순위**: 높음
- **관련 태스크**: -

## 개요

공개 게시글 API에 두 가지 기능을 추가합니다:

1. **게시글 목록 페이징**: `GET /public/posts` 엔드포인트가 현재 모든 게시글을 한 번에 반환하고 있어, 페이징 처리가 필요합니다.

2. **카테고리별 인접 게시글 조회**: `GET /public/posts/:slug` 엔드포인트에서 인접 게시글(adjacentPosts)을 반환하는데, 현재는 전체 게시글 기준입니다. 카테고리 내에서의 이전/다음 글 조회 기능을 추가합니다.

## 작업 범위

### 포함

#### 1. 게시글 목록 페이징
- `GET /public/posts` 엔드포인트에 `page`, `limit` 쿼리 파라미터 추가
- 응답을 `PaginatedResponseDto<PublicPostResponseDto>` 형식으로 변경
- `findPublishedBySiteId()` 메서드 페이징 지원
- `findPublishedBySiteIdAndCategorySlug()` 메서드 페이징 지원

#### 2. 카테고리별 인접 게시글 조회
- `GET /public/posts/:slug` 엔드포인트에 `categorySlug` 쿼리 파라미터 추가
- `categorySlug`가 제공되면 해당 카테고리 내에서 이전/다음 게시글 조회
- `categorySlug`가 없으면 기존처럼 전체 게시글 기준으로 인접 게시글 조회
- `findAdjacentPosts()` 메서드에 카테고리 필터 옵션 추가

### 제외
- 프론트엔드 UI 변경 (별도 태스크)
- 어드민 API 변경 (이미 #27에서 페이징 구현됨)

## 기술 명세

### 영향받는 파일
- `src/post/public-post.controller.ts` - 쿼리 파라미터 및 응답 형식 변경
- `src/post/post.service.ts` - 페이징 및 카테고리 필터 메서드 수정
- `src/post/dto/public-post-query.dto.ts` (신규) - 쿼리 파라미터 DTO

### API 변경사항

#### 1. 게시글 목록 조회 (변경)

**기존:**
```
GET /public/posts?siteSlug=xxx&categorySlug=xxx
Response: PublicPostResponseDto[]
```

**변경 후:**
```
GET /public/posts?siteSlug=xxx&categorySlug=xxx&page=1&limit=10
```

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| siteSlug | string | (필수) | 사이트 slug |
| categorySlug | string | - | 카테고리 필터 (선택) |
| page | number | 1 | 현재 페이지 (1부터 시작) |
| limit | number | 10 | 페이지당 항목 수 (최대 100) |

**응답:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "title": "게시글 제목",
        "slug": "post-slug",
        "publishedAt": "2026-01-25T00:00:00Z",
        "categoryName": "카테고리명",
        "categorySlug": "category-slug"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

#### 2. 게시글 상세 조회 (변경)

**기존:**
```
GET /public/posts/:slug?siteSlug=xxx
```

**변경 후:**
```
GET /public/posts/:slug?siteSlug=xxx&categorySlug=xxx
```

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| siteSlug | string | 사이트 slug (필수) |
| categorySlug | string | 카테고리 slug (선택) - 인접 게시글 조회 범위 지정 |

**인접 게시글 동작:**
- `categorySlug` 없음: 전체 게시글 기준으로 이전/다음 조회 (기존 동작)
- `categorySlug` 있음: 해당 카테고리 내에서만 이전/다음 조회

**응답 (adjacentPosts 부분):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "현재 게시글",
    "adjacentPosts": [
      {
        "id": "...",
        "title": "같은 카테고리 이전 글",
        "slug": "prev-in-category",
        "isCurrent": false
      },
      {
        "id": "...",
        "title": "현재 글",
        "slug": "current-post",
        "isCurrent": true
      },
      {
        "id": "...",
        "title": "같은 카테고리 다음 글",
        "slug": "next-in-category",
        "isCurrent": false
      }
    ]
  }
}
```

### 타입 정의

```typescript
// src/post/dto/public-post-query.dto.ts

import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class PublicPostListQueryDto {
  @IsString()
  siteSlug: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}

export class PublicPostDetailQueryDto {
  @IsString()
  siteSlug: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;
}
```

### 서비스 메서드 변경

```typescript
// src/post/post.service.ts

// 1. 전체 게시글 페이징 조회
async findPublishedBySiteId(
  siteId: string,
  options: { page?: number; limit?: number } = {},
): Promise<PaginatedResponseDto<Post>>

// 2. 카테고리별 게시글 페이징 조회
async findPublishedBySiteIdAndCategorySlug(
  siteId: string,
  categorySlug: string,
  options: { page?: number; limit?: number } = {},
): Promise<PaginatedResponseDto<Post>>

// 3. 인접 게시글 조회 (카테고리 필터 옵션 추가)
async findAdjacentPosts(
  siteId: string,
  currentPostId: string,
  options: { count?: number; categoryId?: string } = {},
): Promise<{ posts: Post[]; currentIndex: number }>
```

## 구현 체크리스트

### 페이징 기능
- [ ] `PublicPostListQueryDto` DTO 클래스 생성
- [ ] `findPublishedBySiteId()` 메서드에 페이징 파라미터 추가
- [ ] `findPublishedBySiteIdAndCategorySlug()` 메서드에 페이징 파라미터 추가
- [ ] `PublicPostController.getPublicPosts()` 응답을 `PaginatedResponseDto`로 변경
- [ ] 기본값 처리 (page=1, limit=10)

### 카테고리별 인접 게시글
- [ ] `PublicPostDetailQueryDto` DTO 클래스 생성
- [ ] `findAdjacentPosts()` 메서드에 `categoryId` 옵션 추가
- [ ] `PublicPostController.getPublicPostBySlug()`에 `categorySlug` 파라미터 추가
- [ ] categorySlug로 categoryId 조회 후 인접 게시글 필터링

### 공통
- [ ] 단위 테스트 작성
- [ ] 빌드 검증

## 테스트 계획

### 단위 테스트

#### 페이징 테스트
- [ ] `findPublishedBySiteId()` 페이징 동작 검증
  - 첫 번째 페이지 조회
  - 중간 페이지 조회
  - 마지막 페이지 조회
  - 범위 초과 페이지 (빈 배열 반환)
- [ ] `findPublishedBySiteIdAndCategorySlug()` 페이징 동작 검증
- [ ] meta 정보 정확성 (totalItems, totalPages, hasNextPage 등)

#### 카테고리별 인접 게시글 테스트
- [ ] categoryId 없이 호출 (기존 동작 - 전체 기준)
- [ ] categoryId 있이 호출 (해당 카테고리 내에서만 조회)
- [ ] 카테고리 내 게시글이 1개인 경우
- [ ] 카테고리 내 게시글이 5개 미만인 경우

### 통합 테스트
- [ ] API 엔드포인트 페이징 파라미터 동작
- [ ] API 엔드포인트 categorySlug 파라미터 동작
- [ ] 응답 형식 검증

## 참고 자료

### 기존 코드
- 공개 게시글 컨트롤러: `src/post/public-post.controller.ts`
- 게시글 서비스: `src/post/post.service.ts`
- 페이징 DTO: `src/common/dto/paginated-response.dto.ts`
- 인접 게시글 구현: `findAdjacentPosts()` 메서드

### 참고 태스크
- 어드민 페이징 구현: `.tasks/review/27-admin-post-pagination-api.md`
- 인접 게시글 API: `.tasks/review/40-adjacent-posts-api.md`
