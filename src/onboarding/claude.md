# Onboarding 모듈

신규 사용자 온보딩 플로우를 담당합니다.

## 온보딩 단계

```
Step 1: PROFILE - 프로필 입력 (name, email)
Step 2: SITE    - 사이트 생성 (name, slug) -> 온보딩 완료
```

## Controllers

### OnboardingController

```
POST /onboarding/profile - Step 1: 프로필 업데이트
POST /onboarding/site    - Step 2: 사이트 생성 (완료 시 온보딩 종료)
```

## 흐름

1. OAuth 로그인 시 `accountStatus: ONBOARDING`, `onboardingStep: 1`로 설정
2. Step 1 완료 시 `onboardingStep: 2`로 변경
3. Step 2 완료 시 `accountStatus: ACTIVE`, `onboardingStep: null`로 변경

## 주의사항

- 온보딩 중인 사용자만 접근 가능
- 현재 단계가 아닌 API 호출 시 ONBOARDING_INVALID_STEP 에러
- 온보딩 완료 후에는 ONBOARDING_NOT_ALLOWED 에러
