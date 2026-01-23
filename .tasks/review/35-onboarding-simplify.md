# [BE] 온보딩 플로우 2단계로 간소화

## GitHub 이슈
- **이슈 번호**: #35
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/35
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-app#39 (프론트엔드 정리)

## 개요

온보딩 과정에서 게시글 작성(3단계)을 제외하고, 프로필 입력(1단계)과 홈페이지 생성(2단계)만으로 구성합니다. 현재 백엔드는 3단계 온보딩을 유지하고 있으나, 프론트엔드는 이미 2단계만 표시하고 있어 불일치가 발생합니다.

## 작업 범위

### 포함
- `OnboardingStep` enum에서 `FIRST_POST` 제거
- `createSite()` 완료 시 직접 온보딩 완료 처리
- 불필요한 API 엔드포인트 제거 (`skip-first-post`)
- 관련 문서 업데이트

### 제외
- 기존 온보딩 중인 사용자의 데이터 마이그레이션 (별도 작업)
- 온보딩 UI 변경 (프론트엔드에서 이미 완료)

## 기술 명세

### 영향받는 파일
- `src/auth/entities/user.entity.ts`
- `src/onboarding/onboarding.service.ts`
- `src/onboarding/onboarding.controller.ts`
- `src/onboarding/claude.md`

### 타입 변경

```typescript
// 변경 전
export const OnboardingStep = {
  PROFILE: 1,
  SITE: 2,
  FIRST_POST: 3,
} as const;

// 변경 후
export const OnboardingStep = {
  PROFILE: 1,
  SITE: 2,
} as const;
```

### 서비스 로직 변경

```typescript
// createSite() 변경
async createSite(userId: string, dto: CreateSiteDto): Promise<void> {
  // ... 기존 로직 ...

  // 사이트 생성
  await this.siteService.createSite(userId, dto.name, dto.slug);

  // 변경: 온보딩 바로 완료
  user.accountStatus = AccountStatus.ACTIVE;
  user.onboardingStep = null;
  await this.userRepository.save(user);
}
```

### API 변경사항

| 엔드포인트 | 변경 |
|-----------|------|
| `POST /onboarding/profile` | 유지 |
| `POST /onboarding/site` | 완료 시 자동으로 온보딩 종료 |
| `POST /onboarding/complete` | 제거 또는 유지 (선택) |
| `POST /onboarding/skip-first-post` | **제거** |

## 구현 체크리스트
- [ ] `OnboardingStep` enum에서 `FIRST_POST` 제거
- [ ] `createSite()` 완료 시 `accountStatus = ACTIVE`, `onboardingStep = null` 설정
- [ ] `completeOnboarding()` 메서드 제거 또는 수정
- [ ] `skipFirstPost()` 메서드 제거
- [ ] `/onboarding/skip-first-post` 엔드포인트 제거
- [ ] `/onboarding/complete` 엔드포인트 제거 또는 유지 결정
- [ ] `src/onboarding/claude.md` 문서 업데이트
- [ ] 단위 테스트 작성/수정

## 테스트 계획
- [ ] 프로필 입력 후 onboardingStep이 2로 변경되는지 확인
- [ ] 사이트 생성 후 accountStatus가 ACTIVE로 변경되는지 확인
- [ ] 사이트 생성 후 onboardingStep이 null로 변경되는지 확인
- [ ] 제거된 엔드포인트 호출 시 404 반환 확인

## 참고 자료
- 현재 온보딩 서비스: `src/onboarding/onboarding.service.ts`
- 사용자 엔티티: `src/auth/entities/user.entity.ts`
- 프론트엔드 온보딩: `app/(auth)/onboarding/` (pagelet-app)
