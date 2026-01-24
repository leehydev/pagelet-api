# [BE] PostDraft 서비스 및 API 구현

- **이슈 번호**: #61
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/61
- **생성일**: 2026-01-24
- **담당**: Developer
- **브랜치**: `feature/61-post-draft-service-api`

## 목적

`PostDraft` 엔티티를 기반으로 드래프트 관리 서비스와 API 엔드포인트를 구현합니다.

## 변경된 버전 관리 전략

### Status 정의
- **PRIVATE**: 비공개 (새 글 또는 비공개 전환)
- **PUBLISHED**: 공개

### 자동저장 로직
- **PRIVATE 상태**: post_drafts에 UPSERT
- **PUBLISHED 상태**: post_drafts에 UPSERT

### 발행 로직
- drafts 내용 -> posts 복사
- status -> PUBLISHED
- drafts 삭제

## 요구사항

- [ ] `PostDraftService` 구현
- [ ] DTO 생성 (Request/Response)
- [ ] `AdminPostController`에 엔드포인트 추가
- [ ] `PostService` 수정 (hasDraft 정보 추가)
- [ ] Swagger 문서화
- [ ] 단위 테스트 작성

## 작업 범위

### 변경/생성할 파일

- `src/post/post-draft.service.ts` - 신규: PostDraftService
- `src/post/dto/save-draft.dto.ts` - 신규: SaveDraftDto
- `src/post/dto/post-draft-response.dto.ts` - 신규: PostDraftResponseDto
- `src/post/admin-post.controller.ts` - 수정: 엔드포인트 추가
- `src/post/dto/post-response.dto.ts` - 수정: hasDraft 필드 추가
- `src/post/post.module.ts` - 수정: 서비스 등록

### 제외 범위

- 비공개 전환 로직 수정 (후속 이슈 #62에서 처리)

## 기술적 상세

### API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/admin/sites/:siteId/posts/:postId/draft` | 드래프트 조회 |
| PUT | `/admin/sites/:siteId/posts/:postId/draft` | 드래프트 저장 (upsert) |
| DELETE | `/admin/sites/:siteId/posts/:postId/draft` | 변경 취소 (드래프트 삭제) |
| POST | `/admin/sites/:siteId/posts/:postId/publish` | 발행 (PRIVATE -> PUBLISHED) |
| POST | `/admin/sites/:siteId/posts/:postId/republish` | 재발행 |

### PostDraftService 메서드

```typescript
@Injectable()
export class PostDraftService {
  // 드래프트 조회
  async findByPostId(postId: string): Promise<PostDraft | null>

  // 드래프트 존재 여부
  async hasDraft(postId: string): Promise<boolean>

  // 드래프트 생성/수정 (upsert)
  async saveDraft(postId: string, dto: SaveDraftDto): Promise<PostDraft>

  // 드래프트 삭제
  async deleteDraft(postId: string): Promise<void>

  // 발행된 게시글 -> 드래프트 복사 (편집 시작 시)
  async createDraftFromPost(post: Post): Promise<PostDraft>

  // 드래프트 -> 게시글 복사 (발행/재발행 시)
  async applyDraftToPost(postId: string): Promise<Post>
}
```

### SaveDraftDto (Request)

```typescript
export class SaveDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @IsOptional()
  contentJson?: Record<string, any>;

  @IsOptional()
  @IsString()
  contentHtml?: string;

  @IsOptional()
  @IsString()
  contentText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImageUrl?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
```

### PostDraftResponseDto (Response)

```typescript
export class PostDraftResponseDto {
  id: string;
  postId: string;
  title: string;
  subtitle: string;
  contentJson: Record<string, any> | null;
  contentHtml: string | null;
  contentText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PostDraftResponseDto>) {
    Object.assign(this, partial);
  }
}
```

### PostResponseDto 수정

```typescript
export class PostResponseDto {
  // ... 기존 필드
  hasDraft: boolean;  // 추가
}
```

### 의존성

- 선행 태스크: #60 (post_drafts 테이블 및 엔티티 생성)
- 후속 태스크: #62 (비공개 전환 API 구현)

## 구현 체크리스트

### PostDraftService
- [ ] `findByPostId()` - 드래프트 조회
- [ ] `hasDraft()` - 존재 여부 확인
- [ ] `saveDraft()` - Upsert 로직
- [ ] `deleteDraft()` - 드래프트 삭제
- [ ] `createDraftFromPost()` - 게시글 -> 드래프트 복사
- [ ] `applyDraftToPost()` - 드래프트 -> 게시글 적용 (발행/재발행)

### DTO
- [ ] `SaveDraftDto` - 드래프트 저장 요청
- [ ] `PostDraftResponseDto` - 드래프트 응답

### Controller 엔드포인트
- [ ] `GET /admin/sites/:siteId/posts/:postId/draft` - 드래프트 조회
- [ ] `PUT /admin/sites/:siteId/posts/:postId/draft` - 드래프트 저장
- [ ] `DELETE /admin/sites/:siteId/posts/:postId/draft` - 변경 취소
- [ ] `POST /admin/sites/:siteId/posts/:postId/publish` - 발행
- [ ] `POST /admin/sites/:siteId/posts/:postId/republish` - 재발행
- [ ] Swagger 문서화 (`@ApiOperation`, `@ApiResponse`)

### PostResponseDto 수정
- [ ] `hasDraft` 필드 추가
- [ ] `getPostById()` 메서드에서 hasDraft 정보 포함

### 테스트
- [ ] PostDraftService 단위 테스트

## 완료 기준 (Definition of Done)

- [ ] 모든 API 엔드포인트 정상 동작
- [ ] Swagger 문서 업데이트
- [ ] 빌드 성공 (`npm run build`)
- [ ] 테스트 통과 (`npm run test`)

## 참고 자료

- `Post` 엔티티: `src/post/entities/post.entity.ts`
- `AdminPostController`: `src/post/admin-post.controller.ts`
- `PostService`: `src/post/post.service.ts`

---

## 진행 로그

### 2026-01-24
- 태스크 파일 생성
- 버전 관리 전략 변경 (DRAFT -> PRIVATE/PUBLISHED)
- 발행 API 추가
