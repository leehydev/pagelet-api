# Site 모듈

사이트(블로그) 관리를 담당합니다.

## 주요 구성요소

### Entity

- `Site` - 사이트 정보

### 주요 필드

```typescript
// 기본 정보
name: string           // 사이트 이름
slug: string           // URL 슬러그 (unique)

// 브랜딩
logoImageUrl: string   // 로고 이미지
faviconUrl: string     // 파비콘

// SEO
seoTitle: string       // SEO 제목
seoDescription: string // SEO 설명
seoKeywords: string    // SEO 키워드
ogImageUrl: string     // OG 이미지
robotsIndex: boolean   // 검색엔진 색인 허용

// 계산 필드 (API 응답에만 포함, DB에 저장 안됨)
// canonicalBaseUrl: 자동 생성 (https://{slug}.{TENANT_DOMAIN})

// 연락처
contactEmail: string
contactPhone: string
address: string

// 소셜 링크
kakaoChannelUrl: string
naverMapUrl: string
instagramUrl: string

// 사업자 정보
businessNumber: string
businessName: string
representativeName: string
```

## Controllers

### AdminSiteController

```
GET /admin/sites                - 내 사이트 목록
```

### AdminSiteSettingsController

```
GET   /admin/sites/:siteId/settings  - 설정 조회
PATCH /admin/sites/:siteId/settings  - 설정 수정
```

### PublicSiteController / PublicSiteSettingsController

```
GET /public/sites/:slug              - 공개 사이트 정보
GET /public/sites/:slug/settings     - 공개 사이트 설정
```

## 관계

- `Site` → `User` (N:1)
- `Site` ← `Post` (1:N)
- `Site` ← `Category` (1:N)

## 주의사항

- slug는 전역 unique (온보딩 시 생성)
- AdminSiteGuard에서 사이트 소유권 검증
