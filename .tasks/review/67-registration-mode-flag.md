# [BE] 회원가입 승인 모드 플래그 관리 기능

## GitHub 이슈
- **이슈 번호**: #67
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/67
- **생성일**: 2026-01-24
- **우선순위**: 높음
- **관련 태스크**: 없음 (백엔드 단독)

## 개요

현재 온보딩 완료 후 무조건 `PENDING` 상태로 전환되는 구조를, **DB 설정 플래그로 제어**하여:
- `PENDING` 모드: 관리자 승인 필요 (베타/제한 운영 시)
- `ACTIVE` 모드: 즉시 활성화 (일반 운영 시)

를 선택할 수 있도록 변경합니다.

## 작업 범위

### 포함
- 시스템 설정 테이블 생성 (system_settings)
- 회원가입 승인 모드 플래그 추가 (`registration_mode`: `PENDING` | `ACTIVE`)
- 온보딩 완료 시 플래그에 따라 상태 결정 로직 구현
- 관리자 API로 플래그 변경 기능

### 제외
- 프론트엔드 변경 (백엔드 로직만)
- 기존 PENDING 사용자 일괄 처리 (마이그레이션 데이터)

## 기술 명세

### 영향받는 파일

| 파일 | 변경 유형 |
|------|----------|
| `src/config/entities/system-setting.entity.ts` | 신규 생성 |
| `src/config/constants/registration-mode.ts` | 신규 생성 |
| `src/config/system-setting.service.ts` | 신규 생성 |
| `src/config/system-setting.module.ts` | 신규 생성 |
| `src/onboarding/onboarding.service.ts` | 수정 |
| `src/onboarding/onboarding.module.ts` | 수정 (의존성 추가) |
| `src/database/migrations/XXXX-CreateSystemSettings.ts` | 신규 생성 |
| `src/superadmin/superadmin.service.ts` | 수정 (설정 변경 API) |
| `src/superadmin/superadmin.controller.ts` | 수정 (설정 변경 API) |

### 엔티티 정의

```typescript
// src/config/entities/system-setting.entity.ts
@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 500 })
  value: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### 상수 정의

```typescript
// src/config/constants/registration-mode.ts
export const RegistrationMode = {
  PENDING: 'PENDING',   // 관리자 승인 필요
  ACTIVE: 'ACTIVE',     // 즉시 활성화
} as const;

export type RegistrationMode = (typeof RegistrationMode)[keyof typeof RegistrationMode];
```

### 온보딩 서비스 수정

```typescript
// src/onboarding/onboarding.service.ts
async createSite(userId: string, dto: CreateSiteDto): Promise<void> {
  // ... 기존 로직 ...

  // 회원가입 모드에 따라 상태 결정
  const registrationMode = await this.systemSettingService.get('registration_mode');

  user.accountStatus = registrationMode === RegistrationMode.ACTIVE
    ? AccountStatus.ACTIVE
    : AccountStatus.PENDING;

  user.onboardingStep = null;
  await this.userRepository.save(user);
}
```

### API 변경사항

#### 관리자 설정 조회/변경 API

```
GET  /superadmin/settings/:key
PUT  /superadmin/settings/:key
```

## 구현 체크리스트

- [ ] SystemSetting 엔티티 생성
- [ ] RegistrationMode 상수 정의
- [ ] SystemSettingService 구현 (get/set)
- [ ] SystemSettingModule 생성
- [ ] DB 마이그레이션 생성
- [ ] 초기 데이터 시딩 (`registration_mode: PENDING`)
- [ ] OnboardingService 수정
- [ ] OnboardingModule에 의존성 추가
- [ ] SuperadminService에 설정 API 추가
- [ ] SuperadminController에 엔드포인트 추가
- [ ] 마이그레이션 실행 및 테스트

## 테스트 계획

- [ ] 단위 테스트: SystemSettingService get/set
- [ ] 통합 테스트: 온보딩 완료 시 PENDING 모드 동작
- [ ] 통합 테스트: 온보딩 완료 시 ACTIVE 모드 동작
- [ ] E2E 테스트: 관리자 설정 변경 API

## 참고 자료

- 현재 온보딩 로직: `src/onboarding/onboarding.service.ts:52-83`
- AccountStatus 정의: `src/auth/entities/user.entity.ts`
- 관리자 서비스: `src/superadmin/superadmin.service.ts`
