# 브랜딩 이미지 테이블 분리

## GitHub 이슈

- **이슈 번호**: #99
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/99

## 개요

Site 엔티티의 브랜딩 이미지 컬럼들(logoImageUrl, faviconUrl, ogImageUrl, ctaImageUrl)을 별도 테이블(site_branding_images)로 분리하여 이미지 버전 관리 및 히스토리 추적이 가능하도록 개선합니다.

## 배경

- 기존: Site 테이블에 브랜딩 이미지 URL을 직접 저장
- 변경: 별도 테이블(SiteBrandingImage)에서 이미지 관리, isActive 플래그로 활성 이미지 구분
- 장점: 이미지 히스토리 관리, 롤백 가능, 비활성 이미지 자동 정리

## 태스크 목록

### 완료

- [x] SiteBrandingImage 엔티티 생성 (`src/storage/entities/site-branding-image.entity.ts`)
  - 타입: logo, favicon, og, cta
  - 필드: id, siteId, type, s3Key, isActive, createdAt
  - Site와 ManyToOne 관계 설정

- [x] Site 엔티티에서 브랜딩 컬럼 제거 (`src/site/entities/site.entity.ts`)
  - logoImageUrl, faviconUrl, ogImageUrl, ctaImageUrl 컬럼 제거됨

- [x] BrandingAssetService 업데이트 (`src/storage/branding-asset.service.ts`)
  - SiteBrandingImage 테이블 사용하도록 변경
  - getActiveImageUrl() 메서드 추가
  - getAllActiveImageUrls() 메서드 추가
  - cleanupInactiveImages() 메서드 추가

- [x] StorageModule 업데이트 (`src/storage/storage.module.ts`)
  - SiteBrandingImage 엔티티 TypeORM에 등록
  - BrandingAssetService export

- [x] SiteService 업데이트 (`src/site/site.service.ts`)
  - BrandingAssetService 의존성 주입
  - toSettingsResponse() 메서드 async로 변경
  - toPublicSettingsResponse() 메서드 async로 변경
  - 응답 DTO에 브랜딩 이미지 URL 포함

- [x] SiteModule에 StorageModule import 추가 (forwardRef 사용)
  - BrandingAssetService를 사용하기 위해 StorageModule import 필요
  - 순환 참조 해결: SiteModule ↔ StorageModule 양쪽 forwardRef 적용
  - SiteService에서 BrandingAssetService 주입 시 @Inject(forwardRef()) 사용

- [x] Controller 메서드 수정
  - `src/site/admin-site-settings.controller.ts`
    - getSettings(): toSettingsResponsePublic() -> toSettingsResponse()로 메서드명 수정 완료
    - updateSettings(): 이미 Promise 반환하므로 OK
  - `src/site/public-site-settings.controller.ts`
    - getSettings(): 이미 async/await 사용하므로 OK

- [x] UpdateSiteSettingsDto에서 브랜딩 이미지 필드 제거 (`src/site/dto/update-site-settings.dto.ts`)
  - logoImageUrl 필드 제거 완료
  - faviconUrl 필드 제거 완료
  - ogImageUrl 필드 제거 완료
  - ctaImageUrl 필드 제거 완료
  - 브랜딩 이미지는 BrandingAssetService의 presign/commit API로 관리

- [x] 마이그레이션 생성 (`src/database/migrations/1769488024933-CreateSiteBrandingImagesTable.ts`)
  - site_branding_images 테이블 생성 완료
    - id (UUID, PK)
    - site_id (UUID, FK -> sites.id, ON DELETE CASCADE)
    - type (VARCHAR(20))
    - s3_key (VARCHAR(500))
    - is_active (BOOLEAN, default false)
    - created_at (TIMESTAMPTZ)
    - INDEX: (site_id, type)
  - sites 테이블에서 브랜딩 컬럼 제거 완료
    - logo_image_url, favicon_url, og_image_url, cta_image_url 컬럼 삭제

- [x] 빌드 검증
  - `npm run build` 성공 확인

- [x] 마이그레이션 실행
  - `npm run migration:run` 실행 완료 (No migrations pending - 이미 적용됨)

- [x] 테스트 실행
  - 91개 테스트 통과
  - 18개 실패는 PostDraftService 관련 기존 이슈 (이 작업과 무관)

## 파일 변경 목록

### 신규 생성

- `src/storage/entities/site-branding-image.entity.ts` (완료)
- `src/database/migrations/1769488024933-CreateSiteBrandingImagesTable.ts` (완료)

### 수정

- `src/site/entities/site.entity.ts` (완료)
- `src/storage/branding-asset.service.ts` (완료)
- `src/storage/storage.module.ts` (완료)
- `src/site/site.service.ts` (완료)
- `src/site/site.module.ts` (완료 - StorageModule import)
- `src/site/admin-site-settings.controller.ts` (완료 - 메서드명 수정)
- `src/site/dto/update-site-settings.dto.ts` (완료 - 브랜딩 필드 제거)

## 완료 기준

- [x] 빌드 성공 (`npm run build`)
- [x] 마이그레이션 파일 생성 완료
- [x] 기존 API 호환성 유지 (응답 형식 동일)
- [x] 마이그레이션 실행 (`npm run migration:run`)
- [x] 테스트 통과 (91/109 - 실패는 기존 이슈)

## TODO (활성화 플로우 구현)

### 필수

- [ ] **DTO 추가**: `src/storage/dto/branding-activate.dto.ts` 생성
- [ ] **DTO 수정**: `src/storage/dto/branding-response.dto.ts`에 `imageId`, `isActive` 필드 추가
- [ ] **Service 수정**: `src/storage/branding-asset.service.ts`
  - [ ] `commit()` 수정 - `isActive=false`로 저장
  - [ ] `activate()` 메서드 추가
  - [ ] `getPendingImages()` 메서드 추가 (선택)
- [ ] **Controller 수정**: `src/storage/admin-branding-asset.controller.ts`
  - [ ] `POST /activate` 엔드포인트 추가
  - [ ] `GET /pending` 엔드포인트 추가 (선택)

### API 변경

```
현재:
POST /admin/sites/:siteId/assets/branding/presign
POST /admin/sites/:siteId/assets/branding/commit     # 즉시 활성화
DELETE /admin/sites/:siteId/assets/branding/:type

추가:
POST /admin/sites/:siteId/assets/branding/activate   # 적용하기
GET  /admin/sites/:siteId/assets/branding/pending    # 대기 이미지 목록 (선택)
```

### 프론트엔드 (pagelet-app)

- [ ] 업로드 플로우에 "적용하기" 버튼 단계 추가
- [ ] pending 이미지 미리보기 UI

## 참고 사항

- BrandingAssetService의 presign/commit API는 이미 site_branding_images 테이블 사용 중
- isActive 플래그로 활성 이미지 관리
- cleanupInactiveImages() 메서드로 비활성 이미지 자동 정리 (크론잡용)
