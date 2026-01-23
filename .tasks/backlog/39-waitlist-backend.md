# [BE] 베타 버전 가입 대기(Waitlist) 기능 구현

## GitHub 이슈
- **이슈 번호**: #39
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/39
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-app#44 (프론트엔드)

## 개요

베타 기간 동안 신규 가입자가 바로 서비스를 사용할 수 없도록 가입 대기(Waitlist) 시스템을 구현합니다.
온보딩 완료 후 사용자를 `PENDING` 상태로 설정하고, 슈퍼 관리자가 승인하면 `ACTIVE` 상태로 변경합니다.

## 작업 범위

### 포함
- `PENDING` 계정 상태 추가 (User 엔티티, AccountStatus)
- 온보딩 완료 시 `PENDING` 상태로 설정 (기존 `ACTIVE` 대신)
- `PENDING` 상태 접근 제어 (AccountStatusGuard 수정)
- 슈퍼 관리자용 대기자 관리 API
- 에러 코드 추가 (`ACCOUNT_PENDING`)

### 제외
- 승인 시 이메일 알림 (추후 구현)
- 대기자 거절/삭제 기능 (추후 구현)
- 기존 사용자 마이그레이션 (이미 `ACTIVE` 상태 유지)

## 기술 명세

### 영향받는 파일

```
src/auth/entities/user.entity.ts        # AccountStatus에 PENDING 추가
src/auth/guards/account-status.guard.ts # PENDING 상태 처리 로직 추가
src/auth/dto/user-response.dto.ts       # (변경 없음, 기존 타입 활용)
src/onboarding/onboarding.service.ts    # createSite()에서 PENDING으로 변경
src/common/exception/error-code.ts      # ACCOUNT_PENDING 에러 코드 추가
src/superadmin/                         # (신규) 슈퍼 관리자 모듈
```

### 데이터베이스 변경

```sql
-- 기존 account_status 컬럼: varchar(20)
-- 새 값 'PENDING' 추가 (DB enum이 아니므로 마이그레이션 불필요)
```

### API 변경사항

#### 1. 온보딩 완료 로직 변경

```typescript
// src/onboarding/onboarding.service.ts
async createSite(userId: string, dto: CreateSiteDto): Promise<void> {
  // ... 기존 로직 ...

  // 변경: ACTIVE → PENDING
  user.accountStatus = AccountStatus.PENDING;
  user.onboardingStep = null;
  await this.userRepository.save(user);
}
```

#### 2. AccountStatusGuard 수정

```typescript
// PENDING 상태는 제한된 접근만 허용
// 일반 Admin API 접근 시 ACCOUNT_PENDING 에러 반환
if (dbUser.accountStatus === AccountStatus.PENDING) {
  throw BusinessException.fromErrorCode(ErrorCode.ACCOUNT_PENDING);
}
```

#### 3. 슈퍼 관리자 API (신규)

```
GET  /superadmin/waitlist          # 대기자 목록 조회
POST /superadmin/waitlist/:userId/approve  # 대기자 승인
```

### 타입 정의

```typescript
// src/auth/entities/user.entity.ts
export const AccountStatus = {
  ONBOARDING: 'ONBOARDING',
  PENDING: 'PENDING',     // 추가: 가입 대기
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

// src/common/exception/error-code.ts
ACCOUNT_PENDING: new ErrorCodeDefinition(
  'ACCOUNT_003',
  HttpStatus.FORBIDDEN,
  'Account is pending approval',
),
```

### 슈퍼 관리자 인증

```typescript
// 방법 1: 환경변수로 슈퍼 관리자 ID 지정
// SUPERADMIN_USER_IDS=uuid1,uuid2

// 방법 2: User 엔티티에 isSuperAdmin 필드 추가
// (MVP에서는 방법 1 권장)
```

## 구현 체크리스트

- [ ] `AccountStatus`에 `PENDING` 상태 추가
- [ ] `ErrorCode`에 `ACCOUNT_PENDING` 추가
- [ ] `AccountStatusGuard` 수정 (PENDING 상태 처리)
- [ ] `OnboardingService.createSite()` 수정 (PENDING으로 변경)
- [ ] 슈퍼 관리자 모듈 생성 (`src/superadmin/`)
- [ ] 대기자 목록 조회 API 구현
- [ ] 대기자 승인 API 구현
- [ ] 슈퍼 관리자 Guard 구현
- [ ] 단위 테스트 작성

## 테스트 계획

- [ ] `AccountStatusGuard` 단위 테스트
  - PENDING 상태 사용자 접근 시 ACCOUNT_PENDING 에러
- [ ] `OnboardingService` 단위 테스트
  - 온보딩 완료 시 PENDING 상태로 설정 확인
- [ ] 슈퍼 관리자 API E2E 테스트
  - 대기자 목록 조회
  - 승인 후 ACTIVE 상태 변경 확인

## 참고 자료

- 기존 코드: `src/auth/guards/account-status.guard.ts`
- 온보딩 서비스: `src/onboarding/onboarding.service.ts`
- 에러 코드: `src/common/exception/error-code.ts`
