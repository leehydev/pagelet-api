# 온보딩 작업 계획서

## 📋 개요
- **프론트엔드 이슈**: #3 (온보딩 3단계 UI/UX)
- **백엔드 이슈**: #4 (온보딩 API 구현)
- **작업 방식**: 단계별 순차 작업 (1단계 → 2단계 → 3단계)

---

## 🎯 공통 사전 작업

### 백엔드
- [ ] User 엔티티에 필드 추가
  - `accountStatus`: enum (ONBOARDING, ACTIVE 등)
  - `onboardingStep`: enum 또는 number (1, 2, 3)
- [ ] UserResponseDto에 필드 추가
  - `accountStatus`, `onboardingStep` 포함
- [ ] GET /auth/me 응답 업데이트
  - accountStatus, onboardingStep 반환
- [ ] 마이그레이션 파일 생성

### 프론트엔드
- [ ] 온보딩 라우트 구조 생성
  - `/onboarding/profile` (Step 1)
  - `/onboarding/site` (Step 2)
  - `/onboarding/first-post` (Step 3)
- [ ] Stepper 컴포넌트 생성
- [ ] 접근 가드 미들웨어/유틸 함수 준비

---

## 1️⃣ Step 1: 프로필 입력

### 백엔드 작업
- [ ] Onboarding 모듈 생성
  - `onboarding.module.ts`
  - `onboarding.controller.ts`
  - `onboarding.service.ts`
- [ ] DTO 생성
  - `CreateProfileDto` (name, email)
  - Validation 추가
- [ ] POST /api/onboarding/profile 엔드포인트 구현
  - 현재 사용자 정보 업데이트
  - onboardingStep을 2로 변경
  - accountStatus는 ONBOARDING 유지
- [ ] 테스트 작성

### 프론트엔드 작업
- [ ] `/onboarding/profile` 페이지 생성
  - 이름 input
  - 이메일 input (카카오 이메일 기본값)
  - "나중에 변경 가능" 안내 문구
  - Validation (이름 필수, 이메일 형식)
- [ ] API 호출 함수 생성
  - `POST /api/onboarding/profile`
- [ ] 성공 시 `/onboarding/site`로 이동
- [ ] 접근 가드 적용
  - accountStatus !== ONBOARDING → 온보딩 진입 불가
  - onboardingStep !== 1 → redirect 처리

### 완료 조건
- ✅ 프로필 입력 폼 정상 동작
- ✅ Validation 통과 시 API 호출 성공
- ✅ 성공 시 Step 2로 이동
- ✅ 잘못된 접근 시 redirect 처리

---

## 2️⃣ Step 2: 홈페이지 생성

### 백엔드 작업
- [ ] Site 엔티티 생성
  - `id`, `user_id`, `name`, `slug`, `created_at`, `updated_at`
  - slug unique 제약조건
- [ ] Site 모듈 생성
  - `site.module.ts`
  - `site.service.ts`
- [ ] DTO 생성
  - `CreateSiteDto` (name, slug)
  - slug validation (예약어 체크)
- [ ] POST /api/onboarding/site 엔드포인트 구현
  - slug 중복 체크
  - Site 생성
  - User의 onboardingStep을 3으로 변경
- [ ] GET /api/sites/check-slug?slug={slug} 엔드포인트 (선택)
  - 실시간 중복 체크용
- [ ] 마이그레이션 파일 생성
- [ ] 테스트 작성

### 프론트엔드 작업
- [ ] `/onboarding/site` 페이지 생성
  - 홈페이지 이름 input
  - 서브도메인(slug) input
  - 실시간 미리보기: `https://{slug}.pagelet.kr`
- [ ] slug 중복 체크 기능
  - debounce 적용
  - API 호출 (GET /api/sites/check-slug 또는 POST /api/onboarding/site에서 에러 처리)
- [ ] 예약어 안내 UI
- [ ] API 호출 함수 생성
  - `POST /api/onboarding/site`
- [ ] 성공 시 `/onboarding/first-post`로 이동
- [ ] 접근 가드 적용
  - onboardingStep !== 2 → redirect 처리

### 완료 조건
- ✅ 홈페이지 생성 폼 정상 동작
- ✅ slug 중복 체크 정상 동작 (debounce)
- ✅ 실시간 미리보기 표시
- ✅ 성공 시 Step 3로 이동
- ✅ 잘못된 접근 시 redirect 처리

---

## 3️⃣ Step 3: 첫 글 작성

### 백엔드 작업
- [ ] Post 엔티티 생성 (없는 경우)
  - `id`, `site_id`, `user_id`, `title`, `content`, `created_at`, `updated_at`
- [ ] Post 모듈 생성
  - `post.module.ts`
  - `post.controller.ts`
  - `post.service.ts`
- [ ] DTO 생성
  - `CreatePostDto` (title, content)
- [ ] POST /api/posts 엔드포인트 구현
  - Post 생성
  - User의 accountStatus를 ACTIVE로 변경
  - onboardingStep을 null 또는 완료 상태로 변경
- [ ] 마이그레이션 파일 생성 (Post 엔티티가 없는 경우)
- [ ] 테스트 작성

### 프론트엔드 작업
- [ ] `/onboarding/first-post` 페이지 생성
  - 제목 input
  - 내용 textarea
  - "작성 완료" 버튼
  - "나중에 할게요" 버튼
- [ ] API 호출 함수 생성
  - `POST /api/posts`
- [ ] "작성 완료" 클릭 시
  - API 호출
  - 성공 시 `/admin` 또는 `/dashboard`로 이동
- [ ] "나중에 할게요" 클릭 시
  - API 호출 없이 `/admin` 또는 `/dashboard`로 이동
  - (백엔드에서 accountStatus 업데이트 필요할 수도 있음)
- [ ] 접근 가드 적용
  - onboardingStep !== 3 → redirect 처리

### 완료 조건
- ✅ 첫 글 작성 폼 정상 동작
- ✅ "작성 완료" 시 API 호출 및 이동
- ✅ "나중에 할게요" 시 스킵 및 이동
- ✅ 완료 후 서비스 진입 가능
- ✅ 잘못된 접근 시 redirect 처리

---

## 🔐 접근 가드 상세

### 프론트엔드 미들웨어/유틸
- [ ] 모든 `/onboarding/*` 경로에서 GET /api/auth/me 호출
- [ ] accountStatus !== 'ONBOARDING' → 온보딩 진입 불가 (redirect)
- [ ] URL과 onboardingStep 불일치 시 올바른 단계로 redirect
  - `/onboarding/profile` → onboardingStep === 1
  - `/onboarding/site` → onboardingStep === 2
  - `/onboarding/first-post` → onboardingStep === 3

---

## 📝 추가 고려사항

### 백엔드
- [ ] 예약어 목록 정의 (admin, api, www 등)
- [ ] slug validation 규칙 정의
- [ ] 에러 코드 정의
- [ ] 온보딩 완료 후 자동으로 accountStatus 변경 로직

### 프론트엔드
- [ ] Stepper UI 컴포넌트
  - 현재 단계: 활성
  - 이전 단계: 클릭 가능
  - 이후 단계: 비활성
- [ ] 로딩 상태 처리
- [ ] 에러 처리 및 사용자 피드백
- [ ] 카카오 이메일 기본값 가져오기 (GET /auth/me에서)

---

## ✅ 최종 완료 조건

- [ ] Stepper UI 정상 동작
- [ ] 단계별 URL 직접 접근 시 올바른 redirect 처리
- [ ] 온보딩 완료 후 서비스 진입 가능
- [ ] 모든 API 엔드포인트 정상 동작
- [ ] Validation 정상 동작
- [ ] 에러 처리 정상 동작
