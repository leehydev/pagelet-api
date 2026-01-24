# [BE] 비공개 전환 API 구현

- **이슈 번호**: #62
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/62
- **생성일**: 2026-01-24
- **담당**: Developer
- **브랜치**: `feature/62-unpublish-api`

## 목적

발행된 게시글을 비공개로 전환하는 API를 구현합니다. 드래프트가 있는 경우 드래프트 내용을 게시글에 머지 후 비공개로 전환합니다.

## 변경된 버전 관리 전략

### Status 정의
- **PRIVATE**: 비공개
- **PUBLISHED**: 공개

### 비공개 전환 로직
- 드래프트 있음: drafts -> posts 머지, drafts 삭제, status -> PRIVATE
- 드래프트 없음: status -> PRIVATE

> 기존 "발행 취소(Unpublish)"를 "비공개 전환"으로 용어 변경

## 요구사항

- [ ] `PostService.unpublishPost()` 메서드 구현
- [ ] 드래프트 머지 로직 추가
- [ ] 이미지 동기화 호출
- [ ] 로그 추가
- [ ] Controller 엔드포인트 추가

## 작업 범위

### 변경/생성할 파일

- `src/post/post.service.ts` - 수정: unpublishPost() 메서드 추가
- `src/post/admin-post.controller.ts` - 수정: 엔드포인트 추가

### 제외 범위

- 없음

## 기술적 상세

### 비공개 전환 로직

**동작 흐름:**
```
// 드래프트가 있는 경우
PUBLISHED + draft -> draft 내용으로 posts 덮어쓰기 -> draft 삭제 -> PRIVATE

// 드래프트가 없는 경우
PUBLISHED -> PRIVATE (기존 내용 유지)
```

### API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/admin/sites/:siteId/posts/:postId/unpublish` | 비공개 전환 |

### PostService.unpublishPost() 구현

```typescript
async unpublishPost(postId: string, siteId: string): Promise<Post> {
  const post = await this.postRepository.findOne({ where: { id: postId } });
  if (!post || post.siteId !== siteId) {
    throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
  }

  if (post.status !== PostStatus.PUBLISHED) {
    throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_PUBLISHED);
  }

  // 드래프트 확인 및 머지
  const draft = await this.postDraftService.findByPostId(postId);
  if (draft) {
    // 드래프트 내용으로 게시글 업데이트
    post.title = draft.title;
    post.subtitle = draft.subtitle;
    post.contentJson = draft.contentJson;
    post.contentHtml = draft.contentHtml;
    post.contentText = draft.contentText;
    post.seoTitle = draft.seoTitle;
    post.seoDescription = draft.seoDescription;
    post.ogImageUrl = draft.ogImageUrl;
    post.categoryId = draft.categoryId;

    // 드래프트 삭제
    await this.postDraftService.deleteDraft(postId);

    this.logger.log(`Unpublish with draft merge: ${postId}`);
  } else {
    this.logger.log(`Unpublish without draft: ${postId}`);
  }

  post.status = PostStatus.PRIVATE;
  post.publishedAt = null;

  const saved = await this.postRepository.save(post);

  // 이미지 동기화
  await this.syncPostImages(siteId, saved.id, saved.contentHtml, saved.ogImageUrl);

  return saved;
}
```

### 의존성 주입

```typescript
@Injectable()
export class PostService {
  constructor(
    // ... 기존 의존성
    @Inject(forwardRef(() => PostDraftService))
    private readonly postDraftService: PostDraftService,
  ) {}
}
```

### 의존성

- 선행 태스크: #60 (post_drafts 테이블 및 엔티티 생성)
- 선행 태스크: #61 (PostDraft 서비스 및 API 구현)

## 구현 체크리스트

- [ ] `PostService`에 `PostDraftService` 의존성 주입
- [ ] `unpublishPost()` 메서드 구현
- [ ] 드래프트 머지 로직 추가
- [ ] 이미지 동기화 호출 (`syncPostImages`)
- [ ] 로그 추가 (비공개 전환 시 드래프트 머지 여부)
- [ ] Controller 엔드포인트 추가 (`POST /unpublish`)
- [ ] Swagger 문서화

## 테스트 케이스

### 비공개 전환 - 드래프트 있음
1. PUBLISHED 상태 게시글 생성
2. 드래프트 저장 (다른 내용으로)
3. 비공개 전환 요청
4. 기대 결과:
   - 게시글 내용이 드래프트 내용으로 변경됨
   - 드래프트 삭제됨
   - status: PRIVATE, publishedAt: null

### 비공개 전환 - 드래프트 없음
1. PUBLISHED 상태 게시글 생성
2. 비공개 전환 요청
3. 기대 결과:
   - 게시글 내용 유지
   - status: PRIVATE, publishedAt: null

## 완료 기준 (Definition of Done)

- [ ] 드래프트가 있는 게시글 비공개 전환 시 드래프트 내용으로 머지
- [ ] 드래프트가 없는 게시글 비공개 전환 시 기존 내용 유지
- [ ] 빌드 성공 (`npm run build`)
- [ ] 테스트 통과 (`npm run test`)

## 참고 자료

- `PostService`: `src/post/post.service.ts`
- 버전 관리 전략 문서

---

## 진행 로그

### 2026-01-24
- 태스크 파일 생성
- "발행 취소" -> "비공개 전환"으로 용어 변경
- DRAFT -> PRIVATE 상태 변경
