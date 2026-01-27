# [BE] canonicalBaseUrl 자동 결정 기능 - 백엔드

## GitHub 이슈

- **이슈 번호**: #38
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/38
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-app#43 (프론트엔드)

## 개요

현재 `canonicalBaseUrl`은 사용자가 관리자 설정 페이지에서 직접 입력하는 방식입니다.
이를 사이트 slug와 환경변수(TENANT_DOMAIN)를 기반으로 자동 생성하도록 변경합니다.

### 변경 이유

- 사용자 실수 방지 (잘못된 URL 입력)
- 불필요한 설정 복잡성 제거
- 플랫폼 차원의 canonical URL 정책 일관성 보장

### Canonical URL 생성 규칙

- 개발: `https://{slug}.pagelet-dev.kr`
- 상용: `https://{slug}.pagelet.kr`
- 환경변수: `TENANT_DOMAIN` (예: `pagelet-dev.kr`, `pagelet.kr`)

## 작업 범위

### 포함

- Site Entity에서 `canonicalBaseUrl` 컬럼 제거
- DB 마이그레이션 작성 (컬럼 drop)
- DTO에서 `canonicalBaseUrl` 필드 제거 (update, response)
- Service에서 `canonicalBaseUrl` 관련 로직 제거
- 응답 DTO에 `canonicalBaseUrl` 계산 필드 추가 (slug + 환경변수 기반)

### 제외

- 프론트엔드 UI 수정 (별도 태스크)
- 기존 데이터 마이그레이션 (컬럼 drop만 수행)

## 기술 명세

### 영향받는 파일

- `src/site/entities/site.entity.ts` - `canonicalBaseUrl` 컬럼 제거
- `src/site/dto/update-site-settings.dto.ts` - `canonicalBaseUrl` 필드 제거
- `src/site/dto/site-settings-response.dto.ts` - `canonicalBaseUrl` 필드 유지 (계산 필드)
- `src/site/dto/public-site-settings-response.dto.ts` - `canonicalBaseUrl` 필드 유지 (계산 필드)
- `src/site/site.service.ts` - 응답 변환 시 canonical URL 계산 로직 추가
- `src/config/` - `TENANT_DOMAIN` 환경변수 설정 추가 (필요시)
- `src/database/migrations/` - 마이그레이션 파일 생성

### 환경 변수 설정

```bash
TENANT_DOMAIN=pagelet-dev.kr  # 개발
TENANT_DOMAIN=pagelet.kr      # 상용
```

### Canonical URL 생성 로직

```typescript
// site.service.ts
private generateCanonicalBaseUrl(slug: string): string {
  const tenantDomain = this.configService.get<string>('TENANT_DOMAIN');
  return `https://${slug}.${tenantDomain}`;
}

// 응답 DTO 변환 시
toSettingsResponse(site: Site): SiteSettingsResponseDto {
  return {
    ...
    canonicalBaseUrl: this.generateCanonicalBaseUrl(site.slug),
    ...
  };
}
```

### DB 마이그레이션

```typescript
// RemoveCanonicalBaseUrlFromSites
export class RemoveCanonicalBaseUrlFromSites implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN IF EXISTS "canonical_base_url"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sites" ADD "canonical_base_url" varchar(500)`);
  }
}
```

## 구현 체크리스트

- [ ] `TENANT_DOMAIN` 환경변수 설정 확인/추가
- [ ] Site Entity에서 `canonicalBaseUrl` 컬럼 제거
- [ ] DB 마이그레이션 파일 생성 (컬럼 drop)
- [ ] `UpdateSiteSettingsDto`에서 `canonicalBaseUrl` 필드 제거
- [ ] `SiteService`에 canonical URL 생성 헬퍼 메서드 추가
- [ ] `toSettingsResponsePublic()` 수정 - 계산된 canonical URL 반환
- [ ] `toPublicSettingsResponse()` 수정 - 계산된 canonical URL 반환
- [ ] 마이그레이션 실행 테스트
- [ ] API 응답 테스트

## 테스트 계획

- [ ] 단위 테스트: canonical URL 생성 로직
- [ ] 통합 테스트: API 응답에 올바른 canonical URL 포함 확인
- [ ] 마이그레이션 테스트: 로컬 DB에서 up/down 실행

## 참고 자료

- 기존 Site Entity: `src/site/entities/site.entity.ts`
- 기존 Site Service: `src/site/site.service.ts`
