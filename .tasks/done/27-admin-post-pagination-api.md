# [BE] 어드민 게시글 목록 API 페이징 구현

## GitHub 이슈

- **이슈 번호**: #27
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/27
- **생성일**: 2026-01-22
- **우선순위**: 높음
- **관련 태스크**: leehydev/pagelet-app#32 (프론트엔드)

## 개요

어드민 게시글 목록 조회 API(`GET /admin/sites/:siteId/posts`)에 페이징 기능을 추가합니다.

## 현재 상태

- 전체 게시글을 한 번에 반환 (페이징 없음)
- `categoryId` 필터만 지원
- 응답에 메타데이터(총 개수, 페이지 정보) 없음

## 작업 범위

### 포함

- 공통 페이징 DTO 생성 (`PaginationQueryDto`, `PaginatedResponseDto`)
- `PostService.findByUserId` 메서드 페이징 지원 추가
- `AdminPostController.getMyPosts` 쿼리 파라미터 수정
- Swagger 문서 업데이트

### 제외

- 프론트엔드 작업 (별도 이슈)

## 기술 명세

### 영향받는 파일

- `src/common/dto/pagination.dto.ts` (신규)
- `src/common/dto/paginated-response.dto.ts` (신규)
- `src/post/post.service.ts` (수정)
- `src/post/admin-post.controller.ts` (수정)

### API 변경사항

#### 요청

```
GET /admin/sites/:siteId/posts?page=1&limit=10&categoryId=xxx
```

| 파라미터   | 타입   | 기본값 | 설명                        |
| ---------- | ------ | ------ | --------------------------- |
| page       | number | 1      | 현재 페이지 (1부터 시작)    |
| limit      | number | 10     | 페이지당 항목 수 (최대 100) |
| categoryId | string | -      | 카테고리 필터 (선택)        |

#### 응답

```json
{
  "success": true,
  "data": {
    "items": [...],
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

### 타입 정의

```typescript
// PaginationQueryDto
export class PaginationQueryDto {
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

// PaginationMeta
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// PaginatedResponseDto
export class PaginatedResponseDto<T> {
  items: T[];
  meta: PaginationMeta;
}
```

## 구현 체크리스트

- [ ] `PaginationQueryDto` 생성
- [ ] `PaginationMeta` 인터페이스 정의
- [ ] `PaginatedResponseDto<T>` 생성
- [ ] `PostService.findByUserId` 페이징 로직 추가
- [ ] `AdminPostController.getMyPosts` 쿼리 파라미터 수정
- [ ] 응답 형식 `PaginatedResponseDto<PostListResponseDto>` 적용
- [ ] Swagger 문서 업데이트
- [ ] 테스트 작성

## 테스트 계획

- [ ] 단위 테스트: PostService 페이징 로직
- [ ] 통합 테스트: API 엔드포인트 페이징 동작

## 참고 자료

- 현재 구현: `src/post/admin-post.controller.ts`
- 서비스 메서드: `src/post/post.service.ts` (findByUserId)
