# [BE] 게시글 상세 조회 시 인접 게시글 목록 API 추가

## GitHub 이슈

- **이슈 번호**: #40
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/40
- **생성일**: 2026-01-23
- **우선순위**: 중간
- **관련 태스크**: FE pagelet-app#45 (인접 게시글 네비게이션 UI 구현)

## 개요

블로그 게시글 상세 조회 페이지 하단에 현재 게시글 전후로 2개씩(총 5개)의 게시글 목록을 보여주는 기능의 백엔드 API를 구현합니다.

예시:

- 게시글이 10개 있고 5번째 게시글을 보는 경우: 3, 4, **5(현재)**, 6, 7번 게시글
- 처음/끝 부분에서는 가능한 만큼만 표시 (예: 1번 게시글이면 1, 2, 3, 4, 5)

## 작업 범위

### 포함

- Public 게시글 상세 조회 API에 인접 게시글 목록 추가
- 현재 게시글 기준 앞뒤 2개씩, 총 5개 게시글 반환
- `publishedAt` 기준 정렬

### 제외

- 프론트엔드 UI 구현 (별도 태스크)
- 같은 카테고리 내 인접 게시글 필터링 (추후 고려)

## 기술 명세

### 영향받는 파일

- `src/post/public-post.controller.ts` - 응답 DTO 변경
- `src/post/post.service.ts` - 인접 게시글 조회 메서드 추가
- `src/post/dto/post-response.dto.ts` - 인접 게시글용 DTO 추가

### API 변경사항

**기존 API:**

```
GET /public/posts/:slug?siteSlug=xxx
```

**변경 후 응답:**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "현재 게시글 제목",
    "subtitle": "...",
    "slug": "current-post",
    "contentHtml": "...",
    "publishedAt": "2026-01-23T00:00:00Z",
    // ... 기존 필드들
    "adjacentPosts": [
      {
        "id": "...",
        "title": "이전 게시글 2",
        "slug": "prev-post-2",
        "ogImageUrl": "...",
        "publishedAt": "2026-01-21T00:00:00Z",
        "isCurrent": false
      },
      {
        "id": "...",
        "title": "이전 게시글 1",
        "slug": "prev-post-1",
        "ogImageUrl": "...",
        "publishedAt": "2026-01-22T00:00:00Z",
        "isCurrent": false
      },
      {
        "id": "...",
        "title": "현재 게시글",
        "slug": "current-post",
        "ogImageUrl": "...",
        "publishedAt": "2026-01-23T00:00:00Z",
        "isCurrent": true
      },
      {
        "id": "...",
        "title": "다음 게시글 1",
        "slug": "next-post-1",
        "ogImageUrl": "...",
        "publishedAt": "2026-01-24T00:00:00Z",
        "isCurrent": false
      },
      {
        "id": "...",
        "title": "다음 게시글 2",
        "slug": "next-post-2",
        "ogImageUrl": "...",
        "publishedAt": "2026-01-25T00:00:00Z",
        "isCurrent": false
      }
    ]
  }
}
```

### 타입 정의

```typescript
// src/post/dto/post-response.dto.ts

export class AdjacentPostDto {
  id: string;
  title: string;
  slug: string;
  ogImageUrl: string | null;
  publishedAt: Date;
  isCurrent: boolean;

  constructor(partial: Partial<AdjacentPostDto>) {
    Object.assign(this, partial);
  }
}

export class PublicPostResponseDto {
  // ... 기존 필드들
  adjacentPosts: AdjacentPostDto[];

  constructor(partial: Partial<PublicPostResponseDto>) {
    Object.assign(this, partial);
  }
}
```

### 서비스 로직

```typescript
// src/post/post.service.ts

/**
 * 현재 게시글 기준 인접 게시글 조회
 * - 현재 게시글을 포함하여 총 5개 반환
 * - publishedAt 기준 앞뒤 2개씩
 * - 처음/끝 부분은 가능한 만큼만 반환
 */
async findAdjacentPosts(
  siteId: string,
  currentPostId: string,
  count: number = 5
): Promise<{ posts: Post[], currentIndex: number }>
```

**알고리즘:**

1. 해당 사이트의 모든 PUBLISHED 게시글을 `publishedAt DESC` 순으로 조회
2. 현재 게시글의 인덱스 찾기
3. 인덱스 기준으로 앞뒤 2개씩 슬라이스 (경계 처리)
4. 현재 게시글 포함 5개 반환

## 구현 체크리스트

- [ ] `AdjacentPostDto` DTO 클래스 추가
- [ ] `PublicPostResponseDto`에 `adjacentPosts` 필드 추가
- [ ] `PostService.findAdjacentPosts()` 메서드 구현
- [ ] `PublicPostController.getPublicPostBySlug()` 응답에 인접 게시글 포함
- [ ] 단위 테스트 작성

## 테스트 계획

- [ ] 단위 테스트: `findAdjacentPosts()` 메서드
  - 중간 위치 게시글 (앞뒤 2개씩 정상 반환)
  - 첫 번째 게시글 (앞에 게시글 없음)
  - 마지막 게시글 (뒤에 게시글 없음)
  - 게시글이 5개 미만인 경우
  - 게시글이 1개인 경우
- [ ] 통합 테스트: API 응답 검증

## 참고 자료

- 기존 `PublicPostController`: `src/post/public-post.controller.ts`
- 기존 `PostService`: `src/post/post.service.ts`
- 기존 DTO: `src/post/dto/post-response.dto.ts`
