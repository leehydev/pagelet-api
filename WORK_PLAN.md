# 작업 계획: Post Thumbnail Presigned Upload (이슈 #9, #10)

## 📋 개요

게시글 썸네일을 URL 입력 방식과 Presigned URL을 통한 직접 업로드 방식 모두 지원하는 기능 구현

---

## 🎯 작업 범위

### 백엔드 (pagelet-api) - 이슈 #10

#### 1. 데이터베이스 스키마

- [ ] `SiteStorageUsage` 엔티티 생성
  - `site_id` (Primary Key, 사이트 ID)
  - `used_bytes` (사용 중인 용량)
  - `reserved_bytes` (예약 중인 용량)
  - `max_bytes` (최대 용량, 기본값 설정)
- [ ] `PostImage` 엔티티 생성 (필수, 메타데이터 추적 및 StorageUsage 관리용)
  - `id`, `site_id`, `post_id` (nullable), `s3_key`, `size_bytes`, `mime_type`, `image_type`, `created_at`
  - `site_id`: 필수 (어떤 사이트의 이미지인지 명확히)
  - `post_id`는 nullable로 설정 (업로드 완료 전에는 null 가능)
  - `image_type`: Enum 타입 (THUMBNAIL, CONTENT, GALLERY 등) - 확장성 고려
- [ ] 마이그레이션 파일 생성 및 실행
- [ ] **참고**: `Post.og_image_url` 필드를 썸네일로 활용 (별도 컬럼 추가 불필요)

#### 2. AWS S3 설정

- [ ] `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` 패키지 설치
- [ ] S3 설정 모듈 생성 (`config/s3.config.ts`)
  - Bucket 이름, Region, Access Key, Secret Key 환경변수 설정
- [ ] S3 서비스 생성 (`storage/s3.service.ts`)
  - Presigned URL 생성 메서드
  - 파일 업로드 검증 메서드 (HEAD Object)

#### 3. Storage 관리 서비스

- [ ] `StorageUsageService` 생성
  - `reserveBytes()`: 용량 예약 (트랜잭션 + row lock)
    - PostImage 엔티티 생성 (site_id 포함)
  - `commitBytes()`: 예약 → 사용으로 이동
    - 트랜잭션 + row lock으로 reserved_bytes 감소, used_bytes 증가
    - PostImage 업데이트 (post_id 연결)
  - `releaseBytes()`: 예약 취소
    - 트랜잭션 + row lock으로 reserved_bytes 감소
    - PostImage 삭제
    - **보장 메커니즘**:
      1. 명시적 호출 (`POST /uploads/abort`)
      2. 정기적인 Cleanup Job (orphaned reservations 정리)
  - `getAvailableBytes()`: 사용 가능한 용량 조회
  - 동시성 제어: `SELECT ... FOR UPDATE` 사용
- [ ] 예약 추적 및 정리
  - presign 시점에 `post_images`에 기록 (site_id, post_id = null)
  - abort/complete 시 `post_images`에서 조회 (site_id로 직접 조회 가능)
  - Cleanup Job으로 orphaned reservations 정리

#### 4. Upload 컨트롤러/서비스 및 예약 관리

- [ ] `UploadController` 생성
  - `POST /uploads/presign`
    - 입력: `{ filename, size, mimeType, imageType?, postId? }`
    - 처리:
      - 용량 체크 → 예약 (reserved_bytes 증가)
      - **PostImage 엔티티 생성** (post_id = null, 임시 기록)
      - Presigned URL 생성
    - 응답: `{ uploadUrl, publicUrl, s3Key, maxSize }`
    - `imageType`: 기본값 'THUMBNAIL' (썸네일 업로드 시)
    - **참고**: PostImage를 presign 시점에 생성하여 abort/complete에서 조회 가능하도록 함
  - `POST /uploads/complete`
    - 입력: `{ s3Key, postId?, imageType? }`
    - 처리:
      - **PostImage 조회** (s3Key로, post_id가 null인 것)
      - HEAD Object로 실제 size/mime 확인
      - PostImage 업데이트 (post_id 연결, 실제 size/mime 반영)
      - reserved_bytes → used_bytes로 이동(commit)
    - 응답: `{ imageId, publicUrl }`
    - `imageType`: presign 단계에서 받은 값 또는 기본값 'THUMBNAIL' 사용
  - `POST /uploads/abort`
    - 입력: `{ s3Key }`
    - 처리:
      - **PostImage 조회** (s3Key로, post_id가 null인 것)
      - PostImage에서 site_id 조회
      - `releaseBytes()` 호출 (트랜잭션 + row lock)
      - PostImage 삭제 또는 마킹
      - (선택) S3 오브젝트 삭제
    - **보장**: 트랜잭션으로 DB 업데이트 보장, PostImage 존재 여부로 중복 처리 방지 (idempotent)
- [ ] `UploadService` 생성
  - Presigned URL 생성 로직
  - S3 업로드 검증 로직 (HEAD Object)
  - StorageUsage 연동
  - PostImage 엔티티 생성/업데이트 로직

#### 5. PostImage 서비스

- [ ] `PostImageService` 생성
  - `create()`: PostImage 엔티티 생성 (image_type 포함)
  - `findByS3Key()`: s3Key로 조회
  - `findByPostIdAndType()`: post_id와 image_type으로 조회
  - `findBySiteIdAndS3Key()`: site_id와 s3Key로 조회
  - `updatePostId()`: 업로드 완료 후 post_id 연결
  - `deleteByS3Key()`: 업로드 중단 시 삭제

#### 6. Post 엔티티/DTO 업데이트

- [ ] `CreatePostDto`의 `og_image_url` 필드를 썸네일 입력으로 활용 (이미 존재)
- [ ] `PostResponseDto`의 `og_image_url` 필드를 썸네일로 표시 (이미 존재)
- [ ] `PostService`에서 `og_image_url` 처리 확인 (이미 구현됨)
- [ ] **참고**: 별도 `thumbnail_url` 컬럼 추가 불필요, 기존 `og_image_url` 활용

#### 7. 에러 처리

- [ ] `ErrorCode`에 Storage 관련 에러 코드 추가
  - `STORAGE_EXCEEDED`: 용량 초과
  - `STORAGE_RESERVE_FAILED`: 예약 실패
  - `UPLOAD_INVALID`: 업로드 검증 실패

#### 8. 예약 정리 스케줄러

- [ ] Cleanup Job 생성 (`storage/cleanup.service.ts`)
  - 매 시간마다 실행 (`@Cron('0 * * * *')`)
  - Orphaned reservations 정리
    - `post_images`에서 `post_id`가 null이고 10분 이상 된 레코드 찾기
    - PostImage에서 site_id 직접 조회
    - 각 레코드에 대해 `releaseBytes()` 호출
    - PostImage 삭제
  - **참고**: Presigned URL 만료 시간(5분)보다 여유있게 10분으로 설정

#### 9. 공개 URL 규칙

- [ ] `publicUrl` 생성 규칙 확정 (예: `https://assets.pagelet-dev.kr/{s3Key}`)
- [ ] 환경변수로 CDN/Assets 도메인 설정

---

### 프론트엔드 (pagelet-app) - 이슈 #9

#### 1. API 연동

- [ ] `src/lib/api.ts`에 Upload API 엔드포인트 추가
  - `presignUpload()`
  - `completeUpload()` (권장)
  - `abortUpload()` (선택)
- [ ] `src/hooks/use-upload.ts` 생성
  - Presigned URL 요청 mutation
  - 업로드 진행 상태 관리
  - 에러 처리 (용량 초과, 파일 형식 오류 등)

#### 2. 썸네일 입력 UI 컴포넌트

- [ ] `src/components/post/thumbnail-input.tsx` 생성
  - URL/업로드 모드 토글
  - URL 모드: URL 입력 + 미리보기
  - 업로드 모드: 파일 선택 + 미리보기 + 진행 상태
  - 에러 메시지 표시
- [ ] 파일 검증 (클라이언트)
  - 파일 타입: `image/jpeg`, `image/png`, `image/webp`
  - 파일 크기: 최대 2MB
  - 미리보기 생성

#### 3. Thumbnail 공통 컴포넌트

- [ ] `src/components/post/thumbnail.tsx` 생성
  - `src` prop으로 이미지 URL 받기
  - `onError` 핸들러로 로드 실패 시 fallback 표시
  - 빈 값일 때 기본 이미지/아이콘 표시
  - (선택) 스켈레톤/로딩 처리

#### 4. 게시글 작성/수정 폼 업데이트

- [ ] `app/(app)/admin/posts/new/page.tsx` 업데이트
  - `ThumbnailInput` 컴포넌트 추가
  - 썸네일 URL 상태 관리 (`ogImageUrl` state 활용)
  - 업로드 중 폼 submit 방지
- [ ] (선택) 게시글 수정 페이지에도 동일 적용

#### 5. 게시글 목록/상세에서 썸네일 표시

- [ ] `app/(app)/admin/posts/page.tsx`에 `Thumbnail` 컴포넌트 추가
- [ ] 공개 게시글 페이지에도 `Thumbnail` 컴포넌트 적용

---

## 🔄 작업 순서 (의존성 고려)

### Phase 1: 백엔드 기반 구축

1. ✅ 데이터베이스 스키마 (PostImage, StorageUsage)
2. ✅ AWS S3 설정 및 서비스
3. ✅ StorageUsage 서비스 (동시성 제어 포함)
4. ✅ Upload API (presign, complete, abort)
5. ✅ PostImage 엔티티/서비스 구현

### Phase 2: 프론트엔드 구현

6. ✅ API 연동 및 Hook 생성
7. ✅ Thumbnail 공통 컴포넌트
8. ✅ ThumbnailInput 컴포넌트
9. ✅ 게시글 작성/수정 폼 통합
10. ✅ 게시글 목록/상세에 썸네일 표시

### Phase 3: 테스트 및 검증

11. ✅ 업로드 플로우 테스트
12. ✅ 용량 초과 케이스 테스트
13. ✅ 동시 업로드 동시성 테스트
14. ✅ Fallback UI 테스트

---

## 📝 상세 작업 항목

### 백엔드 상세

#### 1.1 PostImage 엔티티

```typescript
// src/storage/entities/post-image.entity.ts
export enum PostImageType {
  THUMBNAIL = 'THUMBNAIL', // 썸네일
  CONTENT = 'CONTENT', // 본문 이미지
  GALLERY = 'GALLERY', // 갤러리 이미지
}

@Entity('post_images')
export class PostImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  site_id: string; // 필수: 어떤 사이트의 이미지인지

  @Column({ type: 'uuid', nullable: true })
  post_id: string | null; // 업로드 완료 전에는 null 가능

  @Column({ type: 'varchar', length: 500 })
  s3_key: string;

  @Column({ type: 'bigint' })
  size_bytes: number;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({
    type: 'enum',
    enum: PostImageType,
    default: PostImageType.THUMBNAIL,
  })
  image_type: PostImageType;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
```

#### 1.2 StorageUsage 엔티티

```typescript
// src/storage/entities/storage-usage.entity.ts
@Entity('site_storage_usage')
export class SiteStorageUsage {
  @PrimaryColumn({ type: 'uuid' })
  site_id: string;

  @Column({ type: 'bigint', default: 0 })
  used_bytes: number;

  @Column({ type: 'bigint', default: 0 })
  reserved_bytes: number;

  @Column({ type: 'bigint', default: 1073741824 }) // 1GB 기본값
  max_bytes: number;
}
```

#### 1.3 S3 서비스

- Presigned URL 생성 (PUT 요청용)
- 만료 시간: 5분
- Content-Type 헤더 포함
- S3 Key 형식: `uploads/{siteId}/{timestamp}-{random}.{ext}`

#### 1.4 StorageUsageService 동시성 제어 및 예약 보장

**예약 (reserveBytes)**

```typescript
// 트랜잭션 내에서 row lock 사용
const usage = await this.repository.findOne({
  where: { site_id },
  lock: { mode: 'pessimistic_write' },
});

// reserved_bytes 증가
usage.reserved_bytes += sizeBytes;
await this.repository.save(usage);

// PostImage 엔티티 생성 (임시 기록, post_id = null)
await postImageRepository.save({
  site_id: siteId, // 필수: 사이트 ID
  post_id: null,
  s3_key: s3Key,
  size_bytes: sizeBytes, // 예상 크기 (나중에 HEAD Object로 실제 크기 확인)
  mime_type: mimeType,
  image_type: imageType,
});
```

**예약 취소 보장 메커니즘**

1. **명시적 취소** (`POST /uploads/abort`)
   - PostImage 조회 (s3Key로, post_id가 null)
   - 트랜잭션 + row lock으로 `reserved_bytes` 감소
   - PostImage 삭제 또는 마킹

2. **Cleanup Job (정기 실행)**
   - 매 시간마다 실행
   - `post_images` 테이블에서 `post_id`가 null이고 생성된 지 10분 이상 된 레코드 찾기
   - 각 레코드에 대해:
     - PostImage에서 site_id 직접 조회
     - `releaseBytes()` 호출
     - PostImage 삭제
   - **참고**: Presigned URL 만료 시간(5분)보다 여유있게 10분으로 설정

**Cleanup Job 예시**

```typescript
@Cron('0 * * * *') // 매 시간마다
async cleanupOrphanedReservations() {
  // post_images에서 post_id가 null이고 10분 이상 된 레코드 찾기
  const orphaned = await postImageRepository.find({
    where: { post_id: IsNull() },
    where: { created_at: LessThan(subMinutes(new Date(), 10)) }
  });

  for (const image of orphaned) {
    // PostImage에서 site_id 직접 조회
    const siteId = image.site_id;

    // 예약 해제
    await this.storageUsageService.releaseBytes(
      siteId,
      image.size_bytes,
      image.s3_key
    );

    // PostImage 삭제
    await postImageRepository.remove(image);
  }
}
```

### 백엔드 상세 - 업로드 플로우 및 reserved_bytes 관리

#### 2.1 전체 업로드 플로우 (reserved_bytes 변화 중심)

**초기 상태**

```
site_storage_usage:
  site_id: "site-123"
  used_bytes: 50000000      (50MB 사용 중)
  reserved_bytes: 0         (예약 없음)
  max_bytes: 1073741824     (1GB 최대)
```

---

**1단계: `POST /uploads/presign` - 용량 예약**

**요청**

```json
{
  "filename": "thumbnail.jpg",
  "size": 1048576, // 1MB
  "mimeType": "image/jpeg",
  "imageType": "THUMBNAIL",
  "postId": null // 아직 게시글 생성 전
}
```

**처리 과정**

1. **용량 체크**

   ```typescript
   const available = max_bytes - (used_bytes + reserved_bytes);
   // 1073741824 - (50000000 + 0) = 1023741824 bytes (약 976MB)
   if (size > available) {
     throw STORAGE_EXCEEDED;
   }
   ```

2. **용량 예약 (트랜잭션 + Row Lock)**

   ```typescript
   // BEGIN TRANSACTION
   // SELECT * FROM site_storage_usage WHERE site_id = ? FOR UPDATE
   const usage = await this.repository.findOne({
     where: { site_id: siteId },
     lock: { mode: 'pessimistic_write' },
   });

   // 재확인 (동시성 제어)
   if (usage.used_bytes + usage.reserved_bytes + size > usage.max_bytes) {
     throw STORAGE_EXCEEDED;
   }

   // reserved_bytes 증가
   usage.reserved_bytes += size; // 0 → 1048576
   await this.repository.save(usage);
   // COMMIT
   ```

3. **PostImage 엔티티 생성 (임시 기록)**

   ```typescript
   await postImageRepository.save({
     site_id: siteId,
     post_id: null,
     s3_key: s3Key,
     size_bytes: sizeBytes, // 예상 크기
     mime_type: mimeType,
     image_type: imageType,
   });
   ```

4. **Presigned URL 생성**
   ```typescript
   const s3Key = `uploads/${siteId}/${timestamp}-${random}.jpg`;
   const uploadUrl = await s3Service.generatePresignedUrl(s3Key, 'PUT', 300);
   const publicUrl = `${CDN_URL}/${s3Key}`;
   ```

**상태 변화**

```
site_storage_usage:
  used_bytes: 50000000      (변화 없음)
  reserved_bytes: 1048576   (1MB 예약됨) ⬆️
  max_bytes: 1073741824

post_images:
  {
    id: "img-temp-001",
    site_id: "site-123",  // 필수: 사이트 ID
    post_id: null,  // 아직 게시글 연결 안됨
    s3_key: "uploads/site-123/1234567890-abc.jpg",
    size_bytes: 1048576,  // 예상 크기
    mime_type: "image/jpeg",
    image_type: "THUMBNAIL",
    created_at: "..."
  }
```

**응답**

```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/...?X-Amz-Signature=...",
  "publicUrl": "https://assets.pagelet-dev.kr/uploads/site-123/1234567890-abc.jpg",
  "s3Key": "uploads/site-123/1234567890-abc.jpg",
  "maxSize": 2097152 // 2MB (서버 정책)
}
```

---

**2단계: 클라이언트가 S3에 직접 업로드**

클라이언트가 `PUT uploadUrl`로 파일 업로드 (백엔드 관여 없음)

---

**3단계: `POST /uploads/complete` - 예약 확정 (reserved → used)**

**요청**

```json
{
  "s3Key": "uploads/site-123/1234567890-abc.jpg",
  "postId": "post-456", // 게시글 생성 후 연결
  "imageType": "THUMBNAIL"
}
```

**처리 과정**

1. **S3 업로드 검증 (HEAD Object)**

   ```typescript
   const headObject = await s3Service.headObject(s3Key);
   const actualSize = headObject.ContentLength; // 실제 업로드된 크기
   const mimeType = headObject.ContentType;
   ```

2. **PostImage 엔티티 생성**

   ```typescript
   const postImage = await postImageService.create({
     post_id: postId,
     s3_key: s3Key,
     size_bytes: actualSize,
     mime_type: mimeType,
     image_type: PostImageType.THUMBNAIL,
   });
   ```

3. **PostImage 업데이트 (post_id 연결, 실제 크기 반영)**

   ```typescript
   const postImage = await postImageRepository.findOne({
     where: { s3_key: s3Key, post_id: IsNull() },
   });

   postImage.post_id = postId;
   postImage.size_bytes = actualSize; // 실제 크기로 업데이트
   postImage.mime_type = mimeType;
   await postImageRepository.save(postImage);
   ```

4. **예약 → 사용으로 이동 (트랜잭션 + Row Lock)**

   ```typescript
   // BEGIN TRANSACTION
   const usage = await this.repository.findOne({
     where: { site_id: siteId },
     lock: { mode: 'pessimistic_write' },
   });

   // reserved_bytes 감소, used_bytes 증가
   // 주의: presign 시 예약한 크기와 실제 크기가 다를 수 있음
   usage.reserved_bytes -= postImage.size_bytes; // presign 시 예약한 크기
   usage.used_bytes += actualSize; // 실제 업로드된 크기
   await this.repository.save(usage);
   // COMMIT
   ```

**상태 변화**

```
site_storage_usage:
  used_bytes: 51048576      (50MB + 1MB = 51MB) ⬆️
  reserved_bytes: 0         (예약 해제됨) ⬇️
  max_bytes: 1073741824

post_images:
  {
    id: "img-789",
    post_id: "post-456",
    s3_key: "uploads/site-123/1234567890-abc.jpg",
    size_bytes: 1048576,
    mime_type: "image/jpeg",
    image_type: "THUMBNAIL"
  }
```

**응답**

```json
{
  "imageId": "img-789",
  "publicUrl": "https://assets.pagelet-dev.kr/uploads/site-123/1234567890-abc.jpg"
}
```

---

**4단계: 업로드 중단 시나리오 - `POST /uploads/abort`**

**요청**

```json
{
  "s3Key": "uploads/site-123/1234567890-abc.jpg"
}
```

**처리 과정**

1. **PostImage 조회**

   ```typescript
   const postImage = await postImageRepository.findOne({
     where: { s3_key: s3Key, post_id: IsNull() },
   });

   if (!postImage) {
     // 이미 완료되었거나 존재하지 않음 (idempotent)
     return;
   }

   // PostImage에서 site_id 조회
   const siteId = postImage.site_id;
   ```

2. **예약 취소 (트랜잭션 + Row Lock)**

   ```typescript
   // BEGIN TRANSACTION
   const usage = await this.repository.findOne({
     where: { site_id: siteId },
     lock: { mode: 'pessimistic_write' },
   });

   // reserved_bytes 감소
   usage.reserved_bytes -= postImage.size_bytes; // 1048576 → 0
   await this.repository.save(usage);
   // COMMIT
   ```

3. **PostImage 삭제**

   ```typescript
   await postImageRepository.remove(postImage);
   ```

4. **(선택) S3 오브젝트 삭제**
   ```typescript
   await s3Service.deleteObject(s3Key);
   ```

**상태 변화**

```
site_storage_usage:
  used_bytes: 50000000      (변화 없음)
  reserved_bytes: 0         (예약 해제됨) ⬇️
  max_bytes: 1073741824

post_images:
  → 삭제됨
```

---

**5단계: 자동 예약 해제 시나리오**

**Cleanup Job (매 시간마다)**

```typescript
@Cron('0 * * * *')
async cleanupOrphanedReservations() {
  // 1. post_images에서 post_id가 null이고 10분 이상 된 레코드 찾기
  const orphaned = await postImageRepository.find({
    where: { post_id: IsNull() },
    where: { created_at: LessThan(subMinutes(new Date(), 10)) }
  });

  // 2. 각각에 대해 releaseBytes() 호출
  for (const image of orphaned) {
    // PostImage에서 site_id 직접 조회
    const siteId = image.site_id;

    // 예약 해제
    await this.storageUsageService.releaseBytes(
      siteId,
      image.size_bytes,
      image.s3_key
    );
  }
}
```

---

**요약: reserved_bytes의 생명주기**

```
[초기] reserved_bytes = 0
  ↓
[presign] reserved_bytes += size  (예약)
  ↓
[complete] reserved_bytes -= size, used_bytes += size  (확정)
  또는
[abort] reserved_bytes -= size  (취소)
  또는
[TTL 만료/Cleanup] reserved_bytes -= size  (자동 해제)
```

### 프론트엔드 상세

#### 2.2 프론트엔드 업로드 플로우

1. 파일 선택 → 클라이언트 검증
2. `POST /uploads/presign` 호출 → `{ uploadUrl, publicUrl, s3Key, maxSize }`
3. `PUT uploadUrl`로 S3 업로드 (Content-Type 포함)
4. 업로드 성공 후 `publicUrl`을 게시글 `og_image_url`로 세팅
5. (권장) `POST /uploads/complete` 호출 → `post_images` 기록 및 StorageUsage commit

#### 2.2 ThumbnailInput 컴포넌트 구조

- 모드 토글 (URL / Upload)
- URL 모드: `<input type="url">` + 미리보기
- Upload 모드: `<input type="file">` + 진행 상태 + 미리보기
- 에러 메시지 표시 영역

#### 2.3 Thumbnail 컴포넌트

- `onError` 핸들러로 fallback 이미지 표시
- 기본 이미지: lucide-react의 `Image` 아이콘 또는 기본 이미지 URL

---

## 🧪 테스트 케이스

### 백엔드

- [ ] Presigned URL 생성 성공
- [ ] 용량 초과 시 에러 반환
- [ ] 동시 업로드 시 용량 정확히 계산
- [ ] presign 시점에 PostImage 생성 (post_id = null)
- [ ] 업로드 완료 시 PostImage 업데이트 및 reserved → used 이동
- [ ] 업로드 중단 시 PostImage 조회 후 reserved 롤백 (명시적 취소)
- [ ] Cleanup Job이 orphaned reservations 정리 (post_id가 null이고 10분 이상 된 레코드)
- [ ] 예약 해제가 중복 실행되어도 안전 (idempotent, PostImage 존재 여부로 확인)

### 프론트엔드

- [ ] URL 입력으로 썸네일 저장
- [ ] 파일 업로드로 썸네일 저장
- [ ] 용량 초과 시 에러 메시지 표시
- [ ] 이미지 로드 실패 시 fallback 표시
- [ ] 업로드 중 폼 submit 방지

---

## 📦 필요한 패키지

### 백엔드

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install @nestjs/schedule  # Cleanup Job용 (없는 경우)
```

**참고**: Redis는 사용하지 않음. `post_images` 테이블만으로 예약 추적

### 프론트엔드

- 추가 패키지 불필요 (기존 axios 사용)

---

## 🔐 환경변수 설정

### 백엔드 (.env)

```
AWS_S3_BUCKET=pagelet-uploads
AWS_S3_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
ASSETS_CDN_URL=https://assets.pagelet-dev.kr
```

---

## ✅ Done 기준 (DoD)

- [ ] URL 방식/업로드 방식 모두로 썸네일 저장 가능
- [ ] URL 이미지 로드 실패 시 UI가 깨지지 않고 기본 썸네일로 대체
- [ ] Presigned 업로드로 S3 업로드 후 썸네일 URL이 자동 입력
- [ ] 용량 초과 시 업로드가 차단되고 사용자가 원인을 알 수 있음
- [ ] 동시 업로드 시 용량이 정확히 계산됨
- [ ] 업로드 완료/중단 시 StorageUsage가 올바르게 업데이트됨
