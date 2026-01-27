# [BE] 게시글 저장 로직 단순화 - Draft 독립화

- **이슈 번호**: #110
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/110
- **생성일**: 2026-01-28
- **담당**: Developer
- **브랜치**: `feature/110-post-save-simplification`
- **관련 태스크**: 프론트엔드 태스크 (pagelet-app)

## 목적

게시글 저장 로직을 단순화합니다. 현재 Draft는 특정 Post와 1:1로 연결되어 "수정 중인 상태"를 나타내지만, 이를 독립적인 "임시저장 글 모음"으로 변경합니다.

### 핵심 변경사항

| 구분            | AS-IS                      | TO-BE                  |
| --------------- | -------------------------- | ---------------------- |
| Draft-Post 관계 | 1:1 (postId 필수)          | 독립 (postId 없음)     |
| Draft 용도      | 특정 Post 수정 중 임시저장 | 독립적인 임시글 컬렉션 |
| 자동 저장       | 있음 (부분 업데이트)       | 없음                   |
| 이미지 클린업   | 30분                       | 7일                    |
| Draft 이미지    | PostImage 테이블 공유      | DraftImage 별도 테이블 |

## 요구사항

### 1. PostDraft 엔티티 변경

- [x] `postId` 컬럼 제거 (더 이상 Post와 1:1 관계 아님)
- [x] `siteId` 컬럼 추가 (사이트별 Draft 관리)
- [x] `userId` 컬럼 추가 (작성자 식별)
- [x] `slug` 컬럼 추가 (Post 생성 시 사용)
- [x] `expiresAt` 컬럼 추가 (n일 후 자동 삭제용)

### 2. DraftImage 엔티티 생성

- [x] 새 테이블: `draft_images`
- [x] 컬럼: `id`, `draftId`, `siteId`, `s3Key`, `sizeBytes`, `mimeType`, `imageType`, `pendingDelete`, `createdAt`
- [x] `pendingDelete` 플래그로 삭제 예정 이미지 구분

### 3. API 변경

#### 신규 API

- [x] `GET /admin/v2/drafts` - 임시저장 글 목록 조회
- [x] `POST /admin/v2/drafts` - 새 임시저장 글 생성
- [x] `GET /admin/v2/drafts/:id` - 임시저장 글 상세 조회
- [x] `PUT /admin/v2/drafts/:id` - 임시저장 글 수정
- [x] `DELETE /admin/v2/drafts/:id` - 임시저장 글 삭제
- [x] `POST /admin/v2/drafts/:id/publish` - 임시저장 글 → 게시글로 등록

#### Slug 처리

- Draft 저장 시 `slug` 필드 저장 가능 (optional)
- `POST /admin/v2/drafts/:id/publish` 시 slug 중복 검사
- 중복 시 `DRAFT_SLUG_ALREADY_EXISTS` 에러 반환 (Post 생성 안 함)
- 클라이언트에서 slug 수정 후 재시도

#### 삭제할 API (deprecated 포함)

- [x] `GET /admin/.../posts/:id/draft` - 제거
- [x] `PUT /admin/.../posts/:id/draft` - 제거
- [x] `DELETE /admin/.../posts/:id/draft` - 제거
- [x] `POST /admin/.../posts/:id/publish` - 제거 (이미 deprecated)
- [x] `POST /admin/.../posts/:id/republish` - 제거 (이미 deprecated)
- [x] `POST /admin/.../posts/:id/unpublish` - 제거 (이미 deprecated)
- [x] `PATCH /admin/.../posts/:id` - 제거 (이미 deprecated)
- [x] v1 컨트롤러 (`AdminPostController`) - 단순화 (필수 API만 유지)

### 4. 스케줄러 변경

#### 이미지 클린업 스케줄러 수정

- [x] PostImage 클린업 기간: 30분 → 7일
- [x] DraftImage 클린업 로직 추가
  - `pendingDelete = true`인 이미지 삭제
  - 고아 이미지(draftId가 삭제된 Draft 참조) 삭제

#### 새 스케줄러: Draft 만료 정리

- [x] `expiresAt` 지난 Draft 자동 삭제
- [x] 연결된 DraftImage도 함께 삭제 (CASCADE)
- [x] 스토리지 사용량 갱신

### 5. 기존 데이터 마이그레이션

- [x] 기존 `post_drafts` 데이터 처리 방안: 테이블 삭제 후 재생성 (마이그레이션 파일에 포함)

## 작업 범위

### 변경/생성할 파일

#### 엔티티

- `src/post/entities/post-draft.entity.ts` - 수정: postId 제거, siteId/userId/expiresAt 추가
- `src/storage/entities/draft-image.entity.ts` - 신규: DraftImage 엔티티

#### 서비스

- `src/post/post-draft.service.ts` - 전면 수정: 새 로직
- `src/storage/draft-image.service.ts` - 신규: Draft 이미지 관리
- `src/storage/storage-cleanup.service.ts` - 수정: 클린업 로직 변경

#### 컨트롤러

- `src/post/admin-draft.controller.ts` - 신규: Draft 전용 컨트롤러 (v2)
- `src/post/admin-post.controller.ts` - 수정: deprecated API 제거
- `src/post/admin-post-v2.controller.ts` - 수정: deprecated API 제거

#### 마이그레이션

- `src/database/migrations/XXXXXXXXX-SimplifyPostDrafts.ts` - 신규

### 제외 범위

- 프론트엔드 변경 (별도 태스크)
- Public API 변경 (읽기 전용, 변경 없음)

## 기술적 상세

### 새 post_drafts 스키마

```sql
CREATE TABLE "post_drafts" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "title" varchar(500) NOT NULL DEFAULT '',
  "subtitle" varchar(500) NOT NULL DEFAULT '',
  "slug" varchar(255),
  "content_json" jsonb,
  "content_html" text,
  "content_text" text,
  "seo_title" varchar(255),
  "seo_description" varchar(500),
  "og_image_url" varchar(500),
  "category_id" uuid REFERENCES categories(id) ON DELETE SET NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "IX_post_drafts_site_user" ON "post_drafts" ("site_id", "user_id");
CREATE INDEX "IX_post_drafts_expires_at" ON "post_drafts" ("expires_at");
```

### draft_images 스키마

```sql
CREATE TABLE "draft_images" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "draft_id" uuid NOT NULL REFERENCES post_drafts(id) ON DELETE CASCADE,
  "site_id" uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  "s3_key" varchar(500) NOT NULL,
  "size_bytes" integer NOT NULL DEFAULT 0,
  "mime_type" varchar(100) NOT NULL,
  "image_type" varchar(50) NOT NULL,
  "pending_delete" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "IX_draft_images_draft_id" ON "draft_images" ("draft_id");
CREATE INDEX "IX_draft_images_pending_delete" ON "draft_images" ("pending_delete") WHERE pending_delete = true;
```

### API 플로우

#### 새 글 작성 플로우

```
1. 에디터 진입 (새 글)
2. [저장] 클릭 → POST /admin/v2/drafts → Draft 생성
3. 계속 작성...
4. [저장] 클릭 → PUT /admin/v2/drafts/:id → Draft 업데이트
5. [등록] 클릭 → POST /admin/v2/drafts/:id/publish → Post 생성, Draft 삭제
```

#### 저장된 글 불러오기 플로우

```
1. 에디터 진입 (새 글)
2. [저장된 글 불러오기] 클릭
3. GET /admin/v2/drafts → 목록 모달 표시
4. Draft 선택 → 에디터에 로드
5. (이후 저장/등록 플로우 동일)
```

#### 기존 글 수정 플로우

```
1. 에디터 진입 (기존 Post 편집)
2. 수정...
3. [등록] 클릭 → PUT /admin/v2/posts/:id → Post 업데이트
   (저장 버튼 없음, 임시저장 불가)
```

### 설정값

```typescript
// Draft 보관 기간 (일)
const DRAFT_RETENTION_DAYS = 14;

// 이미지 클린업 기간 (일)
const POST_IMAGE_CLEANUP_DAYS = 7;

// Draft 이미지 pendingDelete 클린업 기간 (시간)
const DRAFT_IMAGE_PENDING_DELETE_HOURS = 24;
```

## 완료 기준 (Definition of Done)

- [x] PostDraft 엔티티 변경 완료
- [x] DraftImage 엔티티 생성 완료
- [x] 마이그레이션 작성 완료 (실행은 배포 시)
- [x] 신규 Draft API 구현 완료
- [x] deprecated API 제거 완료
- [x] 스케줄러 수정 완료
- [x] 빌드 성공 (`npm run build`)
- [x] 테스트 통과 (`npm run test`)
- [ ] API 문서 (Swagger) 업데이트 - 자동 생성됨

## 참고 자료

- 기존 PostDraft 엔티티: `src/post/entities/post-draft.entity.ts`
- 기존 PostImage 엔티티: `src/storage/entities/post-image.entity.ts`
- 스토리지 클린업: `src/storage/storage-cleanup.service.ts`
- 기존 Draft API: `src/post/admin-post-v2.controller.ts`

---

## 진행 로그

### 2026-01-28

- 태스크 파일 생성
- 요구사항 정리 완료

#### 구현 완료

**엔티티 변경:**

- `src/post/entities/post-draft.entity.ts` - postId 제거, siteId/userId/expiresAt 추가
- `src/storage/entities/draft-image.entity.ts` - 신규 생성

**서비스 변경:**

- `src/post/post-draft.service.ts` - 전면 재작성 (새 API 지원)
- `src/storage/draft-image.service.ts` - 신규 생성
- `src/storage/storage-cleanup.service.ts` - 클린업 로직 수정 (7일, DraftImage, 만료 Draft)
- `src/post/post.service.ts` - PostDraftService 의존성 제거, syncImagesForPostAndDraft 제거

**컨트롤러 변경:**

- `src/post/admin-draft-v2.controller.ts` - 신규 생성 (Draft 전용 API)
- `src/post/admin-post-v2.controller.ts` - deprecated API 제거 (draft, publish, republish, unpublish, patch)
- `src/post/admin-post.controller.ts` - 단순화 (필수 API만 유지)

**DTO:**

- `src/post/dto/create-draft.dto.ts` - 신규
- `src/post/dto/update-draft.dto.ts` - 신규
- `src/post/dto/draft-response.dto.ts` - 신규

**마이그레이션:**

- `src/database/migrations/1769529871000-SimplifyPostDrafts.ts` - 신규

**에러 코드:**

- `DRAFT_NOT_FOUND` (DRAFT_001) 추가
- `DRAFT_SLUG_ALREADY_EXISTS` (DRAFT_002) 추가

**테스트:**

- `src/post/post-draft.service.spec.ts` - 재작성 (새 API에 맞게)

**검증:**

- `npm run build` ✅
- `npm run test` ✅ (112 passed, 3 todo)
