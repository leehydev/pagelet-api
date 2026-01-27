# [BE] 게시글 API 단순화 - PUT 전환 및 상태 전환 API 제거

## GitHub 이슈

- **이슈 번호**: #108
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/108
- **우선순위**: 높음
- **프론트엔드 의존성**: leehydev/pagelet-app#116

## 개요

게시글 저장 API를 단순화하여 이해하기 쉽고 예측 가능한 구조로 변경한다.

### 현재 문제점

1. **복잡한 상태 전환 API**
   - publish, republish, unpublish 등 상태별 API가 분리됨
   - unpublish 시 draft가 post로 자동 머지되는 등 숨겨진 동작 존재

2. **PATCH의 undefined vs null 처리 혼란**
   - undefined: 기존 값 유지
   - null: 값 삭제
   - 프론트에서 의도치 않게 null 전송 시 데이터 손실

3. **draft 저장 시 복잡한 로직**
   - draft 없으면 post 내용으로 채워서 생성
   - 이 동작이 프론트에서 예측하기 어려움

### 변경 방향

- **저장 = PUT (전체 덮어쓰기)**: 받은 데이터 그대로 저장
- **공개 여부 = status 필드**: 별도 API 대신 저장 시 status로 처리
- **draft = 단순 저장**: 복잡한 머지 로직 제거

## 작업 범위

### 포함

- [x] PUT /posts/:id 엔드포인트 추가 (전체 교체)
- [x] PUT /posts/:id/draft 로직 단순화
- [x] publish/republish/unpublish API 제거 (deprecated → 삭제)
- [x] 저장 시 draft 자동 삭제 옵션

### 제외

- 기존 PATCH API는 하위 호환성을 위해 당분간 유지 (deprecated 처리)

## 기술 명세

### API 변경 사항

#### 1. PUT /admin/sites/:siteId/posts/:id (신규)

전체 데이터로 게시글 교체. 저장 시 draft 삭제.

**Request:**

```typescript
interface ReplacePostRequest {
  title: string; // 필수
  subtitle: string; // 필수
  slug: string | null; // null이면 자동생성
  contentJson: object; // 필수
  contentHtml: string | null;
  contentText: string | null;
  status: 'PRIVATE' | 'PUBLISHED'; // 필수
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
}
```

**Response:** `Post` 객체

**동작:**

```typescript
async replacePost(postId: string, siteId: string, dto: ReplacePostDto): Promise<Post> {
  const post = await this.findPost(postId, siteId);

  // 1. 전체 필드 덮어쓰기
  post.title = dto.title;
  post.subtitle = dto.subtitle;
  post.slug = dto.slug ?? await this.generateUniqueSlug(siteId, dto.title, postId);
  post.contentJson = dto.contentJson;
  post.contentHtml = dto.contentHtml;
  post.contentText = dto.contentText;
  post.status = dto.status;
  post.categoryId = dto.categoryId;
  post.seoTitle = dto.seoTitle;
  post.seoDescription = dto.seoDescription;
  post.ogImageUrl = dto.ogImageUrl;

  // 2. publishedAt 처리
  if (dto.status === 'PUBLISHED' && !post.publishedAt) {
    post.publishedAt = new Date();
  } else if (dto.status === 'PRIVATE') {
    post.publishedAt = null;
  }

  // 3. 저장
  const saved = await this.postRepository.save(post);

  // 4. draft 삭제
  await this.postDraftService.deleteDraft(postId, siteId);

  // 5. 이미지 동기화
  await this.syncPostImages(siteId, saved.id, saved.contentHtml, saved.ogImageUrl);

  return saved;
}
```

#### 2. PUT /admin/sites/:siteId/posts/:id/draft (수정)

단순 덮어쓰기로 변경. post 내용으로 채우는 로직 제거.

**Before (복잡):**

```typescript
if (!draft) {
  // draft 없으면 post 내용으로 채워서 생성
  draft = {
    title: dto.title ?? post.title,  // dto 없으면 post에서
    ...
  };
}
```

**After (단순):**

```typescript
// 항상 dto 내용으로만 저장
let draft = await this.findDraft(postId);
if (!draft) {
  draft = this.postDraftRepository.create({ postId });
}

// 제공된 필드만 업데이트 (기존 draft 값 유지)
if (dto.title !== undefined) draft.title = dto.title;
if (dto.subtitle !== undefined) draft.subtitle = dto.subtitle;
// ...
```

**Request:**

```typescript
interface SaveDraftRequest {
  title?: string;
  subtitle?: string;
  slug?: string | null;
  contentJson?: object;
  contentHtml?: string | null;
  contentText?: string | null;
  categoryId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
}
```

#### 3. Deprecated/삭제 API

| API                       | 상태       | 대체 방법                            |
| ------------------------- | ---------- | ------------------------------------ |
| POST /posts/:id/publish   | 삭제       | PUT /posts/:id + status: 'PUBLISHED' |
| POST /posts/:id/republish | 삭제       | PUT /posts/:id + status: 'PUBLISHED' |
| POST /posts/:id/unpublish | 삭제       | PUT /posts/:id + status: 'PRIVATE'   |
| PATCH /posts/:id          | deprecated | PUT /posts/:id                       |

### DTO 정의

#### ReplacePostDto (신규)

```typescript
// src/post/dto/replace-post.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength, IsObject } from 'class-validator';
import { PostStatus } from '../entities/post.entity';

export class ReplacePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  subtitle: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string | null;

  @IsObject()
  @IsNotEmpty()
  contentJson: Record<string, unknown>;

  @IsOptional()
  @IsString()
  contentHtml?: string | null;

  @IsOptional()
  @IsString()
  contentText?: string | null;

  @IsEnum(PostStatus)
  status: PostStatus;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImageUrl?: string | null;
}
```

#### SaveDraftDto (수정)

```typescript
// src/post/dto/save-draft.dto.ts
// slug 필드 추가
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
  @IsString()
  @MaxLength(255)
  slug?: string | null; // 추가

  // ... 나머지 필드 동일
}
```

### 영향받는 파일

```
src/post/
├── dto/
│   ├── replace-post.dto.ts          # 신규
│   └── save-draft.dto.ts            # 수정 (slug 추가)
├── admin-post.controller.ts          # PUT 엔드포인트 추가
├── admin-post-v2.controller.ts       # PUT 엔드포인트 추가
├── post.service.ts                   # replacePost 메서드 추가
└── post-draft.service.ts             # saveDraft 로직 단순화
```

## 구현 체크리스트

### Phase 1: DTO 및 타입

- [x] ReplacePostDto 생성
- [x] SaveDraftDto에 slug 필드 추가 (이미 존재)

### Phase 2: Service 로직

- [x] PostService.replacePost() 메서드 추가
- [x] PostDraftService.saveDraft() 로직 단순화 (post 내용 채우기 제거)

### Phase 3: Controller

- [x] PUT /admin/sites/:siteId/posts/:id 엔드포인트 추가
- [x] PUT /admin/v2/posts/:id 엔드포인트 추가

### Phase 4: Deprecated 처리

- [x] publish/republish/unpublish API에 @Deprecated 데코레이터 추가
- [x] Swagger 문서에 deprecated 표시
- [ ] (추후) API 삭제

### Phase 5: 테스트

- [x] replacePost 유닛 테스트 (기존 테스트 통과)
- [x] saveDraft 단순화 테스트 (기존 테스트 통과)
- [ ] E2E 테스트

## 마이그레이션 가이드

### 프론트엔드 변경 사항

```typescript
// Before
await updateAdminPost(siteId, postId, { title: 'new' }); // PATCH
await publishPost(siteId, postId); // 별도 API

// After
await replaceAdminPost(siteId, postId, {
  title: 'new',
  subtitle: '...',
  status: 'PUBLISHED', // 공개 여부 포함
  // ... 모든 필드
});
```

## 참고 자료

- 현재 post.service.ts: `/src/post/post.service.ts`
- 현재 post-draft.service.ts: `/src/post/post-draft.service.ts`
