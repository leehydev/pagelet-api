# Onboarding 모듈

신규 사용자 온보딩 플로우를 담당합니다.

## 온보딩 단계

```
Step 1: PROFILE    - 프로필 입력 (name, email)
Step 2: SITE       - 사이트 생성 (name, slug)
Step 3: FIRST_POST - 첫 글 작성 (선택, 스킵 가능)
```

## Controllers

### OnboardingController

```
PATCH /onboarding/profile     - Step 1: 프로필 업데이트
POST  /onboarding/site        - Step 2: 사이트 생성
POST  /onboarding/complete    - Step 3: 온보딩 완료
POST  /onboarding/skip        - Step 3: 스킵
```

## 흐름

1. OAuth 로그인 시 `accountStatus: ONBOARDING`, `onboardingStep: 1`로 설정
2. 각 단계 완료 시 다음 단계로 이동
3. Step 3 완료/스킵 시 `accountStatus: ACTIVE`로 변경

## 주의사항

- 온보딩 중인 사용자만 접근 가능
- 현재 단계가 아닌 API 호출 시 ONBOARDING_INVALID_STEP 에러
- 온보딩 완료 후에는 ONBOARDING_NOT_ALLOWED 에러
