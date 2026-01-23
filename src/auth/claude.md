# Auth 모듈

사용자 인증 및 권한 관리를 담당합니다.

## 주요 구성요소

### Entity

- `User` - 사용자 정보 (email, name, accountStatus, onboardingStep)
- `SocialAccount` - OAuth 연동 계정 (provider, providerId)

### 상태 값

```typescript
// 계정 상태
AccountStatus.ONBOARDING  // 온보딩 중
AccountStatus.ACTIVE      // 활성
AccountStatus.SUSPENDED   // 정지
AccountStatus.WITHDRAWN   // 탈퇴

// 온보딩 단계
OnboardingStep.PROFILE // 1: 프로필 입력
OnboardingStep.SITE    // 2: 사이트 생성 -> 온보딩 완료
```

### Guards

- `JwtAuthGuard` - JWT 토큰 검증 (전역 적용)
- `AccountStatusGuard` - 계정 상태 검증 (전역 적용)
- `AdminSiteGuard` - URL의 :siteId로 사이트 소유권 검증
- `PublicSiteGuard` - 공개 API용 사이트 검증

### Decorators

- `@CurrentUser()` - JWT에서 추출한 사용자 정보
- `@CurrentSite()` - Guard에서 설정한 사이트 정보
- `@Public()` - 인증 불필요 표시

### OAuth

- `oauth/` 폴더에 OAuth 프로바이더별 클라이언트 구현
- 현재 Kakao OAuth 지원

## API 엔드포인트

```
POST /auth/kakao/callback  - Kakao OAuth 콜백
GET  /auth/me              - 현재 사용자 정보
POST /auth/logout          - 로그아웃
```

## 주의사항

- `@Public()` 데코레이터가 없으면 자동으로 JWT 인증 필요
- AccountStatusGuard가 SUSPENDED/WITHDRAWN 상태 차단
