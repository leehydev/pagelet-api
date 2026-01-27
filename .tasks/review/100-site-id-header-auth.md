# [BE] Site ID 헤더 기반 인증 시스템

## GitHub 이슈

- **이슈 번호**: #100
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/100
- **우선순위**: 높음
- **관련 태스크**: -

## 개요

Admin API에서 URL에 노출되는 사이트 ID를 HTTP 헤더로 변경하여 보안성을 향상시킵니다.

### 배경
- 현재: `/admin/sites/:siteId/posts` 형태로 URL에 사이트 ID 노출
- 문제: 타인의 사이트 ID로 접근 시도 가능 (실제 접근은 차단되지만 UX 측면에서 불안감)
- 해결: `X-Site-Id` 헤더로 사이트 ID 전송, URL에서 제거

## 작업 범위

### 포함
- `AdminSiteHeaderGuard` 신규 Guard 구현
- 헤더 기반 사이트 소유권 검증 로직
- 에러 코드 추가 (헤더 누락)
- PoC용 Category V2 컨트롤러 구현
- 단위 테스트 작성

### 제외
- 기존 URL 파라미터 방식 Admin 컨트롤러 수정 (PoC 검증 후 별도 작업)
- 프론트엔드 API 호출 수정 (별도 FE 이슈)

## 기술 명세

### 영향받는 파일

**신규 생성:**
- `src/auth/guards/admin-site-header.guard.ts`
- `src/auth/guards/admin-site-header.guard.spec.ts`
- `src/category/admin-category-v2.controller.ts`

**수정:**
- `src/common/exception/error-code.ts`
- `src/auth/auth.module.ts`
- `src/category/category.module.ts`

### API 변경사항

#### 헤더 스펙
| 헤더 이름 | 값 형식 | 필수 여부 |
|-----------|---------|----------|
| `X-Site-Id` | UUID v4 | 필수 (Admin API) |

#### PoC 엔드포인트
| 기존 | 변경 |
|------|------|
| `GET /admin/sites/:siteId/categories` | `GET /admin/v2/categories` (헤더: X-Site-Id) |
| `POST /admin/sites/:siteId/categories` | `POST /admin/v2/categories` (헤더: X-Site-Id) |
| `PUT /admin/sites/:siteId/categories/:id` | `PUT /admin/v2/categories/:id` (헤더: X-Site-Id) |
| `DELETE /admin/sites/:siteId/categories/:id` | `DELETE /admin/v2/categories/:id` (헤더: X-Site-Id) |

### 타입 정의

```typescript
// 에러 응답 예시

// 헤더 누락
{
  "success": false,
  "error": { "code": "SITE_003", "message": "X-Site-Id header is required" }
}

// 사이트 미존재
{
  "success": false,
  "error": { "code": "SITE_002", "message": "Site not found" }
}

// 권한 없음
{
  "success": false,
  "error": { "code": "COMMON_004", "message": "Access denied to this site" }
}
```

## 구현 체크리스트

### Phase 1: Guard 구현
- [ ] `AdminSiteHeaderGuard` 클래스 생성
  - [ ] `X-Site-Id` 헤더 추출 로직
  - [ ] UUID 형식 유효성 검사
  - [ ] SiteService.findById() 호출
  - [ ] 소유권 검증 (site.userId === user.userId)
  - [ ] request.site 설정
  - [ ] 적절한 에러 처리

### Phase 2: 에러 코드 추가
- [ ] `SITE_HEADER_MISSING` - X-Site-Id 헤더 누락

### Phase 3: PoC 컨트롤러 구현
- [ ] `AdminCategoryV2Controller` 생성
  - [ ] 새 라우트 경로: `/admin/v2/categories`
  - [ ] `@UseGuards(AdminSiteHeaderGuard)` 적용
  - [ ] 기존 CategoryService 재사용

### Phase 4: 테스트
- [ ] 단위 테스트 작성
  - [ ] 헤더 없음 케이스
  - [ ] 잘못된 UUID 형식 케이스
  - [ ] 사이트 미존재 케이스
  - [ ] 소유권 없음 케이스
  - [ ] 정상 케이스
- [ ] 수동 테스트 (Postman/curl)

### Phase 5: 모듈 설정
- [ ] `AuthModule`에 `AdminSiteHeaderGuard` provider 및 export 추가
- [ ] `CategoryModule`에 PoC 컨트롤러 등록

## 테스트 계획

### 단위 테스트
- [ ] AdminSiteHeaderGuard 테스트
  - 헤더 누락 → SITE_HEADER_MISSING 에러
  - 잘못된 UUID → COMMON_BAD_REQUEST 에러
  - 사이트 미존재 → SITE_NOT_FOUND 에러
  - 소유권 없음 → COMMON_FORBIDDEN 에러
  - 정상 → request.site 설정 및 true 반환

### 수동 테스트
- [ ] curl로 헤더 포함/미포함 요청 테스트
- [ ] 다른 유저의 사이트 ID로 요청 시 403 응답 확인

## 참고 자료

### 기존 코드 참고
- `src/auth/guards/admin-site.guard.ts` - 기존 Guard 로직
- `src/auth/decorators/current-site.decorator.ts` - 재사용할 데코레이터
- `src/category/admin-category.controller.ts` - PoC 대상 원본

### 설계 결정
1. **기존 코드 영향 최소화**: 새 Guard 추가, 기존 AdminSiteGuard 유지
2. **점진적 마이그레이션**: PoC 검증 후 확대
3. **동일한 데코레이터 재사용**: `@CurrentSite()` 변경 없음

## 후속 작업

PoC 검증 완료 후:
1. 모든 Admin 컨트롤러 헤더 기반으로 전환
2. 프론트엔드 API 호출 수정 (별도 FE 이슈)
3. 기존 URL 파라미터 방식 deprecate
