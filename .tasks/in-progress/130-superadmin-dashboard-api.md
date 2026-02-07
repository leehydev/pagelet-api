# [BE] 슈퍼어드민 대시보드 API

- **이슈 번호**: #130
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/130
- **생성일**: 2026-02-07
- **담당**: Developer
- **브랜치**: `feature/superadmin-dashboard-api`

## 목적

슈퍼어드민 대시보드 화면에 필요한 통계 데이터를 제공하는 API 구현.
플랫폼 전체의 사용자, 사이트, 포스트 현황과 스토리지 사용량을 조회한다.

## 대시보드 요구 데이터

### 1. 요약 카드 (4개)

| 항목 | 데이터 | 소스 |
|------|--------|------|
| 총 사용자 | 전체 수 + 이번주 증가 | User (ACTIVE 상태) |
| 총 사이트 | 전체 수 + 이번주 증가 | Site |
| 총 포스트 | 전체 수 + 이번주 증가 | Post (PUBLISHED) |
| 대기자 | 승인 필요 수 | User (PENDING 상태) |

### 2. 차트 (2개)

| 차트 | 데이터 | 기간 |
|------|--------|------|
| 일별 가입자 추이 | 날짜별 가입자 수 | 최근 7일 |
| 일별 포스트 발행 | 날짜별 발행 수 | 최근 7일 |

### 3. 목록 (2개)

| 목록 | 데이터 | 항목 |
|------|--------|------|
| 최근 가입 대기자 | 이메일, 가입 시간 | 최근 5건 |
| 최근 생성된 사이트 | 슬러그, 소유자 | 최근 5건 |

### 4. 스토리지

| 항목 | 데이터 |
|------|--------|
| 전체 사용량 | 사용 중 / 전체 용량 (%) |

---

## 요구사항

- [x] 대시보드 통합 API 구현 (`GET /superadmin/dashboard`)
- [x] 최근 사이트 목록 API 구현 (`GET /superadmin/sites/recent`)
- [x] 스토리지 요약 API 구현 (`GET /superadmin/storage/summary`)
- [x] 기존 waitlist API에 limit 쿼리 파라미터 추가

---

## 작업 범위

### 변경/생성할 파일

```
src/superadmin/
├── superadmin.controller.ts      # 엔드포인트 추가
├── superadmin.service.ts         # 비즈니스 로직 추가
├── dto/
│   ├── dashboard-response.dto.ts        # 대시보드 통합 응답
│   ├── dashboard-summary.dto.ts         # 요약 통계
│   ├── daily-stats.dto.ts               # 일별 통계
│   ├── recent-site-response.dto.ts      # 최근 사이트
│   └── storage-summary-response.dto.ts  # 스토리지 요약
└── superadmin.module.ts          # 의존성 추가 (Post, Site, Storage)
```

### 제외 범위

- 프론트엔드 대시보드 UI (pagelet-app)
- 대기자 목록 API 자체 (기존 구현 활용)

---

## 기술 명세

### API 1: 대시보드 통합 조회

```typescript
@Get('dashboard')
@UseGuards(SuperAdminGuard)
getDashboard(): Promise<DashboardResponseDto>
```

#### Response DTO

```typescript
export class DashboardResponseDto {
  summary: DashboardSummaryDto;
  dailySignups: DailyStatsDto[];
  dailyPosts: DailyStatsDto[];

  constructor(partial: Partial<DashboardResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DashboardSummaryDto {
  totalUsers: number;        // ACTIVE 상태 사용자 수
  weeklyNewUsers: number;    // 이번주 신규 가입자
  totalSites: number;        // 전체 사이트 수
  weeklyNewSites: number;    // 이번주 신규 사이트
  totalPosts: number;        // PUBLISHED 포스트 수
  weeklyNewPosts: number;    // 이번주 발행 포스트
  pendingUsers: number;      // 승인 대기 사용자 수
}

export class DailyStatsDto {
  date: string;   // YYYY-MM-DD
  count: number;
}
```

#### 쿼리 예시

```sql
-- 총 사용자 (ACTIVE)
SELECT COUNT(*) FROM users WHERE account_status = 'ACTIVE';

-- 이번주 신규 가입자 (월요일 기준)
SELECT COUNT(*) FROM users
WHERE account_status = 'ACTIVE'
  AND created_at >= date_trunc('week', CURRENT_DATE);

-- 총 사이트
SELECT COUNT(*) FROM sites;

-- 이번주 신규 사이트
SELECT COUNT(*) FROM sites
WHERE created_at >= date_trunc('week', CURRENT_DATE);

-- 총 포스트 (PUBLISHED)
SELECT COUNT(*) FROM posts WHERE status = 'PUBLISHED';

-- 이번주 발행 포스트
SELECT COUNT(*) FROM posts
WHERE status = 'PUBLISHED'
  AND published_at >= date_trunc('week', CURRENT_DATE);

-- 대기자 수
SELECT COUNT(*) FROM users WHERE account_status = 'PENDING';

-- 일별 가입자 추이 (7일)
SELECT DATE(created_at) as date, COUNT(*) as count
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- 일별 포스트 발행 (7일)
SELECT DATE(published_at) as date, COUNT(*) as count
FROM posts
WHERE status = 'PUBLISHED'
  AND published_at >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY DATE(published_at)
ORDER BY date;
```

---

### API 2: 최근 생성 사이트

```typescript
@Get('sites/recent')
@UseGuards(SuperAdminGuard)
getRecentSites(
  @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number
): Promise<RecentSiteResponseDto[]>
```

#### Response DTO

```typescript
export class RecentSiteResponseDto {
  id: string;
  slug: string;
  name: string;
  userId: string;
  userName: string | null;
  createdAt: Date;

  constructor(partial: Partial<RecentSiteResponseDto>) {
    Object.assign(this, partial);
  }
}
```

#### 쿼리 예시

```sql
SELECT s.id, s.slug, s.name, s.user_id, u.name as user_name, s.created_at
FROM sites s
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT :limit;
```

---

### API 3: 스토리지 요약

```typescript
@Get('storage/summary')
@UseGuards(SuperAdminGuard)
getStorageSummary(): Promise<StorageSummaryResponseDto>
```

#### Response DTO

```typescript
export class StorageSummaryResponseDto {
  totalUsedBytes: number;      // 전체 사용량 (bytes)
  totalMaxBytes: number;       // 전체 용량 (bytes)
  usagePercentage: number;     // 사용률 (%)
  totalUsedDisplay: string;    // 표시용 (예: "125GB")
  totalMaxDisplay: string;     // 표시용 (예: "500GB")

  constructor(partial: Partial<StorageSummaryResponseDto>) {
    Object.assign(this, partial);
  }
}
```

#### 쿼리 예시

```sql
SELECT
  SUM(used_bytes) as total_used_bytes,
  SUM(max_bytes) as total_max_bytes
FROM site_storage_usage;
```

---

### API 4: Waitlist API 수정 (기존)

```typescript
@Get('waitlist')
@UseGuards(SuperAdminGuard)
getWaitlist(
  @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number  // 0 = 전체
): Promise<WaitlistUserResponseDto[]>
```

- `limit=0`: 전체 조회 (기존 동작 유지)
- `limit=5`: 최근 5건만 조회

---

## 구현 체크리스트

### DTO 생성

- [x] `DashboardResponseDto` 생성
- [x] `DashboardSummaryDto` 생성
- [x] `DailyStatsDto` 생성
- [x] `RecentSiteResponseDto` 생성
- [x] `StorageSummaryResponseDto` 생성

### Service 구현

- [x] `getDashboard()` - 대시보드 통합 데이터 조회
- [x] `getDashboardSummary()` - 요약 통계 조회
- [x] `getDailySignups(days: number)` - 일별 가입자 추이
- [x] `getDailyPosts(days: number)` - 일별 포스트 발행
- [x] `getRecentSites(limit: number)` - 최근 사이트 목록
- [x] `getStorageSummary()` - 스토리지 요약

### Controller 구현

- [x] `GET /superadmin/dashboard` 엔드포인트
- [x] `GET /superadmin/sites/recent` 엔드포인트
- [x] `GET /superadmin/storage/summary` 엔드포인트
- [x] 기존 `GET /superadmin/waitlist`에 limit 쿼리 추가

### Module 수정

- [x] `TypeOrmModule.forFeature`에 Post, Site, SiteStorageUsage 추가

---

## 테스트 계획

- [ ] 대시보드 API 응답 형식 검증
- [ ] 이번주 기준 계산 정확성 검증 (월요일 시작)
- [ ] 일별 통계 날짜 정확성 검증
- [ ] 최근 사이트 정렬 순서 검증
- [ ] 스토리지 용량 계산 정확성 검증
- [ ] limit 파라미터 동작 검증
- [ ] SuperAdminGuard 권한 검증

---

## 참고 자료

- 기존 코드: `src/superadmin/superadmin.service.ts`
- Entity: `src/auth/entities/user.entity.ts`
- Entity: `src/site/entities/site.entity.ts`
- Entity: `src/post/entities/post.entity.ts`
- Entity: `src/storage/entities/storage-usage.entity.ts`

---

## 진행 로그

### 2026-02-07

- 태스크 파일 생성
- DTO 5개 생성 완료
- Service 메서드 6개 구현 완료
- Controller 엔드포인트 4개 추가 완료
- Module 의존성 추가 완료
- 빌드 성공 확인
