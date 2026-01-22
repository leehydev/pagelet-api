# Storage 모듈

파일 업로드 및 스토리지 관리를 담당합니다.

## 주요 구성요소

### Entity

- `PostImage` - 게시글 이미지 메타데이터
- `StorageUsage` - 사이트별 스토리지 사용량

### PostImage 타입

```typescript
PostImageType.THUMBNAIL  // 썸네일
PostImageType.CONTENT    // 본문 이미지
PostImageType.GALLERY    // 갤러리 이미지
```

## Services

### S3Service

- AWS S3 연동
- Presigned URL 생성

### UploadService

- 업로드 흐름 관리 (presign → commit/abort)
- 멀티파트 업로드 지원

### PostImageService

- 게시글 이미지 CRUD
- postId 연결/해제

### BrandingAssetService

- 로고, 파비콘, OG 이미지 등 브랜딩 에셋 관리

### StorageUsageService

- 사이트별 스토리지 사용량 추적
- 용량 초과 검증

### StorageCleanupService

- 미사용 이미지 정리 (스케줄러)
- postId가 null인 오래된 이미지 삭제

## Controllers

### AdminUploadController

```
POST /admin/sites/:siteId/upload/presign    - Presigned URL 발급
POST /admin/sites/:siteId/upload/complete   - 업로드 완료
POST /admin/sites/:siteId/upload/abort      - 업로드 취소
```

### AdminBrandingAssetController

```
POST   /admin/sites/:siteId/branding/presign  - 브랜딩 에셋 업로드 URL
POST   /admin/sites/:siteId/branding/commit   - 브랜딩 에셋 적용
DELETE /admin/sites/:siteId/branding/:type    - 브랜딩 에셋 삭제
```

## 업로드 흐름

1. `presign` - S3 presigned URL 발급
2. 클라이언트가 S3에 직접 업로드
3. `complete` - 업로드 완료 처리, PostImage 레코드 생성
4. (실패 시) `abort` - 정리

## 주의사항

- 업로드 완료 전 postId는 null
- postId가 null인 이미지는 cleanup 대상
- 스토리지 용량 초과 시 STORAGE_EXCEEDED 에러
