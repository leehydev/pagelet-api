# Banner 모듈

사이트 배너 이미지 관리를 담당합니다.

## 주요 구성요소

### Entity

- `SiteBanner` - 배너 (imageUrl, linkUrl, deviceType, displayOrder 등)

### 디바이스 타입

```typescript
DeviceType.DESKTOP  // 데스크톱 배너
DeviceType.MOBILE   // 모바일 배너
```

### 주요 필드

```typescript
siteId: string          // 소속 사이트
imageUrl: string        // 배너 이미지 URL
linkUrl: string | null  // 클릭 시 이동 URL
openInNewTab: boolean   // 새 탭에서 열기
isActive: boolean       // 활성화 상태
startAt: Date | null    // 노출 시작 시간
endAt: Date | null      // 노출 종료 시간
displayOrder: number    // 표시 순서
altText: string | null  // 대체 텍스트
deviceType: string      // 디바이스 타입 (desktop/mobile)
```

## Controllers

### AdminBannerController

```
POST   /admin/sites/:siteId/banners/presign  - 이미지 업로드 URL 발급
POST   /admin/sites/:siteId/banners          - 배너 생성
GET    /admin/sites/:siteId/banners          - 배너 목록 (deviceType 필터)
GET    /admin/sites/:siteId/banners/:id      - 배너 상세
PUT    /admin/sites/:siteId/banners/:id      - 배너 수정
DELETE /admin/sites/:siteId/banners/:id      - 배너 삭제
PUT    /admin/sites/:siteId/banners/order    - 순서 변경
```

### PublicBannerController

```
GET /public/banners?siteSlug=xxx&deviceType=desktop  - 활성 배너 조회
```

## 관계

- `SiteBanner` -> `Site` (N:1)

## 제약사항

- 디바이스 타입별 배너 최대 5개
- 파일 크기: 5MB 제한
- 허용 MIME: image/png, image/jpeg, image/webp
- linkUrl: http/https 프로토콜만 허용

## Public API 필터링

활성 배너 조회 시 다음 조건이 적용됩니다:
- `isActive = true`
- `startAt IS NULL OR startAt <= now()`
- `endAt IS NULL OR endAt >= now()`

## 주의사항

- displayOrder가 지정되지 않으면 자동으로 마지막 순서 + 1
- 삭제 시 Site 삭제와 함께 CASCADE 삭제됨
- 순서 변경 시 해당 deviceType의 모든 배너가 재정렬됨
