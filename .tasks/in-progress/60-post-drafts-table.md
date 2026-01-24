# [BE] post_drafts 테이블 및 엔티티 생성

- **이슈 번호**: #60
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/60
- **생성일**: 2026-01-24
- **담당**: Developer
- **브랜치**: `feature/60-post-drafts-table`

## 목적

게시글 버전 관리를 위한 `post_drafts` 테이블과 TypeORM 엔티티를 생성합니다. 발행된 게시글을 편집할 때 원본을 보존하면서 수정 작업을 진행할 수 있도록 합니다.

## 변경된 버전 관리 전략

### Status 정의
- **PRIVATE**: 비공개 (새 글 또는 비공개 전환)
- **PUBLISHED**: 공개

### 상태 판단 로직

| posts.status | post_drafts | 상태 |
|--------------|-------------|------|
| PRIVATE | 있음 | 새 글 작성 중 |
| PRIVATE | 없음 | 비공개 글 |
| PUBLISHED | 없음 | 발행됨 |
| PUBLISHED | 있음 | 발행됨 + 편집 중 |

### 시나리오별 동작

| 상태 | 액션 | 동작 |
|------|------|------|
| 새 글 | 작성 시작 | posts에 PRIVATE로 생성 |
| PRIVATE | 자동저장 | post_drafts UPSERT |
| PRIVATE | 발행 | drafts -> posts, status -> PUBLISHED, drafts 삭제 |
| PUBLISHED | 편집 시작 | posts -> post_drafts 복사 (없을 때만) |
| PUBLISHED | 자동저장 | post_drafts UPSERT |
| PUBLISHED | 재발행 | drafts -> posts, drafts 삭제 |
| PUBLISHED | 변경 취소 | drafts 삭제 |
| PUBLISHED | 비공개 전환 | status -> PRIVATE (drafts 있으면 머지 후 삭제) |

## 요구사항

- [ ] `PostDraft` 엔티티 생성
- [ ] 마이그레이션 파일 작성
- [ ] `PostModule`에 엔티티 등록
- [ ] 빌드 성공 확인
- [ ] 마이그레이션 실행 테스트

## 작업 범위

### 변경/생성할 파일

- `src/post/entities/post-draft.entity.ts` - 신규: PostDraft 엔티티
- `src/database/migrations/XXXXXXXXX-AddPostDraftsTable.ts` - 신규: 마이그레이션
- `src/post/post.module.ts` - 수정: 엔티티 등록

### 제외 범위

- 서비스/API 구현 (후속 이슈 #61에서 처리)
- 이미지 테이블 (기존 post_images 그대로 사용)

## 기술적 상세

### post_drafts 테이블 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | 드래프트 고유 ID |
| post_id | UUID | FK, UNIQUE, NOT NULL | 연결된 게시글 ID (1:1 관계) |
| title | VARCHAR(500) | NOT NULL | 제목 |
| subtitle | VARCHAR(500) | NOT NULL | 부제목 |
| content_json | JSONB | NULLABLE | Tiptap 에디터 JSON |
| content_html | TEXT | NULLABLE | 렌더링용 HTML |
| content_text | TEXT | NULLABLE | 검색/미리보기용 텍스트 |
| seo_title | VARCHAR(255) | NULLABLE | SEO 제목 |
| seo_description | VARCHAR(500) | NULLABLE | SEO 설명 |
| og_image_url | VARCHAR(500) | NULLABLE | OG 이미지 URL |
| category_id | UUID | FK, NULLABLE | 카테고리 ID |
| created_at | TIMESTAMPTZ | NOT NULL | 생성일 |
| updated_at | TIMESTAMPTZ | NOT NULL | 수정일 |

### 엔티티 정의

```typescript
@Entity('post_drafts')
export class PostDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  postId: string;

  @OneToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  subtitle: string;

  @Column({ type: 'jsonb', nullable: true })
  contentJson: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  contentHtml: string | null;

  @Column({ type: 'text', nullable: true })
  contentText: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  seoTitle: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  seoDescription: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ogImageUrl: string | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne('Category', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### 마이그레이션 내용

```sql
-- post_drafts 테이블 생성
CREATE TABLE "post_drafts" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "post_id" uuid NOT NULL,
  "title" character varying(500) NOT NULL,
  "subtitle" character varying(500) NOT NULL,
  "content_json" jsonb,
  "content_html" text,
  "content_text" text,
  "seo_title" character varying(255),
  "seo_description" character varying(500),
  "og_image_url" character varying(500),
  "category_id" uuid,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_post_drafts" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_post_drafts_post_id" UNIQUE ("post_id")
);

-- 외래키 제약조건
ALTER TABLE "post_drafts"
ADD CONSTRAINT "FK_post_drafts_post"
FOREIGN KEY ("post_id") REFERENCES "posts"("id")
ON DELETE CASCADE;

ALTER TABLE "post_drafts"
ADD CONSTRAINT "FK_post_drafts_category"
FOREIGN KEY ("category_id") REFERENCES "categories"("id")
ON DELETE SET NULL;
```

### 의존성

- 선행 태스크: 없음
- 후속 태스크: #61 (PostDraft 서비스 및 API 구현)

## 완료 기준 (Definition of Done)

- [ ] `PostDraft` 엔티티 생성 완료
- [ ] 마이그레이션 파일 작성 완료
- [ ] `PostModule`에 엔티티 등록 완료
- [ ] 빌드 성공 (`npm run build`)
- [ ] 마이그레이션 실행 성공 (`npm run migration:run`)
- [ ] 기존 테스트 통과 (`npm run test`)

## 참고 자료

- 기존 `Post` 엔티티: `src/post/entities/post.entity.ts`
- 마이그레이션 예시: `src/database/migrations/1768960000000-AddCategoriesTable.ts`

---

## 진행 로그

### 2026-01-24
- 태스크 파일 생성
- 버전 관리 전략 변경 (DRAFT -> PRIVATE/PUBLISHED)
