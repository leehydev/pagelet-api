# User isAdmin 필드 및 예약어 슬러그 테이블 구현

## GitHub 이슈

- **이슈 번호**: #104
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/104
- **우선순위**: 높음
- **관련 태스크**: 없음

## 개요

User 엔티티에 `isAdmin` 필드를 추가하고, 예약어 슬러그를 DB 테이블로 관리하도록 변경합니다. 예약어 슬러그로 사이트 생성 시 어드민 계정만 허용하는 기능을 구현합니다.

## 작업 범위

### 포함

- User 엔티티에 `isAdmin` boolean 필드 추가
- `reserved_slugs` 테이블 생성 (예약어 DB 관리)
- 기존 하드코딩된 예약어를 DB로 마이그레이션
- 예약어 슬러그의 `adminOnly` 플래그 지원
- SuperAdmin API로 예약어 CRUD 기능 제공
- 사이트 생성 시 isAdmin 사용자 예외 처리

### 제외

- 프론트엔드 UI 변경
- 기존 SuperAdmin 환경변수 기반 인증 변경 (별도 유지)

## 기술 명세

### 영향받는 파일

| 파일 경로                                          | 변경 유형 | 설명                       |
| -------------------------------------------------- | --------- | -------------------------- |
| `src/auth/entities/user.entity.ts`                 | 수정      | isAdmin 필드 추가          |
| `src/site/entities/reserved-slug.entity.ts`        | **신규**  | ReservedSlug 엔티티        |
| `src/site/site.service.ts`                         | 수정      | 예약어 로직 DB 조회로 변경 |
| `src/site/site.module.ts`                          | 수정      | ReservedSlug 엔티티 등록   |
| `src/onboarding/onboarding.service.ts`             | 수정      | isAdmin 사용자 예외 처리   |
| `src/superadmin/superadmin.service.ts`             | 수정      | 예약어 CRUD 메서드 추가    |
| `src/superadmin/superadmin.controller.ts`          | 수정      | 예약어 관리 API 추가       |
| `src/superadmin/superadmin.module.ts`              | 수정      | ReservedSlug 의존성        |
| `src/superadmin/dto/reserved-slug-response.dto.ts` | **신규**  | 응답 DTO                   |
| `src/superadmin/dto/create-reserved-slug.dto.ts`   | **신규**  | 생성 DTO                   |
| `src/superadmin/dto/set-user-admin.dto.ts`         | **신규**  | 어드민 설정 DTO            |
| `src/common/exception/error-code.ts`               | 수정      | 새 에러 코드 추가          |
| `src/database/migrations/XXXX-*.ts`                | **신규**  | 마이그레이션               |

### 신규 API 엔드포인트

| Method | Endpoint                             | 설명                    |
| ------ | ------------------------------------ | ----------------------- |
| GET    | `/superadmin/reserved-slugs`         | 예약어 슬러그 목록 조회 |
| POST   | `/superadmin/reserved-slugs`         | 예약어 슬러그 추가      |
| DELETE | `/superadmin/reserved-slugs/:slugId` | 예약어 슬러그 삭제      |
| PUT    | `/superadmin/users/:userId/admin`    | 사용자 어드민 권한 설정 |

### 타입 정의

```typescript
// ReservedSlug 엔티티
@Entity('reserved_slugs')
export class ReservedSlug {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;  // 예약 사유 (선택)

  @Column({ type: 'boolean', default: false })
  adminOnly: boolean;  // true: 어드민만 사용 가능, false: 모두 사용 불가

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

// User 엔티티 추가 필드
@Column({ type: 'boolean', default: false })
isAdmin: boolean;
```

### 에러 코드

```typescript
RESERVED_SLUG_NOT_FOUND: new ErrorCodeDefinition(
  'RESERVED_SLUG_001',
  HttpStatus.NOT_FOUND,
  'Reserved slug not found',
),
RESERVED_SLUG_ALREADY_EXISTS: new ErrorCodeDefinition(
  'RESERVED_SLUG_002',
  HttpStatus.CONFLICT,
  'Reserved slug already exists',
),
SITE_SLUG_RESERVED_ADMIN_ONLY: new ErrorCodeDefinition(
  'SITE_004',
  HttpStatus.FORBIDDEN,
  'This slug is reserved for admin users only',
),
```

## 구현 체크리스트

### Phase 1: 기반 작업

- [x] User 엔티티에 `isAdmin` 필드 추가
- [x] ReservedSlug 엔티티 생성 (`src/site/entities/reserved-slug.entity.ts`)
- [x] SiteModule에 ReservedSlug 엔티티 등록
- [x] 마이그레이션 파일 생성 및 실행

### Phase 2: 서비스 레이어

- [x] 에러 코드 추가 (`error-code.ts`)
- [x] SiteService의 예약어 검증 로직 DB 조회로 변경
- [x] OnboardingService에 isAdmin 예외 처리 추가

### Phase 3: SuperAdmin 기능

- [x] DTO 생성 (ReservedSlugResponseDto, CreateReservedSlugDto, SetUserAdminDto)
- [x] SuperAdminModule에 SiteModule 의존성 추가
- [x] SuperAdminService에 예약어 CRUD 메서드 추가
- [x] SuperAdminService에 setUserAdmin 메서드 추가
- [x] SuperAdminController에 API 엔드포인트 추가

### Phase 4: 테스트

- [x] 단위 테스트 작성
- [ ] E2E 테스트 작성 (선택)

## 테스트 계획

### 단위 테스트

- [ ] SiteService.isSlugAvailable() - 예약어 체크 로직
- [ ] SiteService.checkReservedSlug() - adminOnly 플래그 확인
- [ ] OnboardingService.createSite() - isAdmin 예외 처리
- [ ] SuperAdminService CRUD 메서드

### 통합 테스트

- [ ] 일반 사용자가 예약어 슬러그로 사이트 생성 시 실패
- [ ] 어드민 사용자가 adminOnly 슬러그로 사이트 생성 시 성공
- [ ] SuperAdmin API로 예약어 CRUD 동작 확인

## 참고 자료

- 현재 예약어 목록 (하드코딩): `src/site/site.service.ts` 15~28행
- SuperAdmin 가드: `src/superadmin/guards/superadmin.guard.ts`
- 온보딩 사이트 생성: `src/onboarding/onboarding.service.ts`

## 주의사항

1. **기존 데이터 호환성**: 마이그레이션에서 기존 하드코딩된 예약어를 DB에 삽입하여 기존 동작 유지
2. **isAdmin 기본값**: `false`로 설정하여 기존 사용자에게 영향 없음
3. **SuperAdmin vs isAdmin 구분**:
   - `SuperAdmin`: 환경변수 기반, 시스템 관리자 (예약어 관리 등)
   - `isAdmin`: DB 필드 기반, 예약어 슬러그 사용 권한
4. **순환 의존성**: OnboardingModule -> SiteModule 의존성 이미 존재하므로 문제 없음
