# [BE] Naver Search Advisor 키값 저장 API 구현

## GitHub 이슈

- **이슈 번호**: #88
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/88
- **생성일**: 2026-01-25
- **우선순위**: 중간
- **관련 태스크**: [FE] pagelet-app#85 (의존)

## 개요

각 사이트(블로그)별로 Naver Search Advisor 인증 키값을 저장할 수 있도록 API를 구현합니다. 저장된 키값은 프론트엔드에서 메타태그로 동적 렌더링됩니다.

## 작업 범위

### 포함

- Site Entity에 `naverSearchAdvisorKey` 필드 추가
- 마이그레이션 파일 생성
- Request/Response DTO 업데이트
- Service 레이어 수정

### 제외

- 메타태그 렌더링 (프론트엔드 담당)
- UI 구현 (프론트엔드 담당)

## 기술 명세

### 영향받는 파일

- `src/site/entities/site.entity.ts`
- `src/site/dto/update-site-settings.dto.ts`
- `src/site/dto/site-settings-response.dto.ts`
- `src/site/dto/public-site-settings-response.dto.ts`
- `src/site/site.service.ts`
- `src/database/migrations/XXXXXXXXX-AddNaverSearchAdvisorKey.ts` (새 파일)

### Entity 변경

```typescript
// site.entity.ts
@Column({ type: 'varchar', length: 255, nullable: true })
naverSearchAdvisorKey: string | null;
```

### DTO 변경

```typescript
// update-site-settings.dto.ts
@IsOptional()
@IsString()
@MaxLength(255)
naverSearchAdvisorKey?: string | null;

// site-settings-response.dto.ts
@ApiPropertyOptional({ description: 'Naver Search Advisor 사이트 인증 키' })
naverSearchAdvisorKey: string | null;

// public-site-settings-response.dto.ts (공개 API용)
@ApiPropertyOptional({ description: 'Naver Search Advisor 사이트 인증 키' })
naverSearchAdvisorKey: string | null;
```

### Service 변경

```typescript
// site.service.ts - updateSettings 메서드
if (dto.naverSearchAdvisorKey !== undefined) {
  site.naverSearchAdvisorKey = dto.naverSearchAdvisorKey;
}

// toSettingsResponsePublic, toPublicSettingsResponse 메서드
naverSearchAdvisorKey: site.naverSearchAdvisorKey,
```

### API 엔드포인트

- `GET /admin/sites/:siteId/settings` - 키값 조회
- `PUT /admin/sites/:siteId/settings` - 키값 저장
- `GET /sites/:slug/settings` - 공개 API (메타태그 렌더링용)

## 구현 체크리스트

- [ ] Site Entity에 naverSearchAdvisorKey 필드 추가
- [ ] 마이그레이션 파일 생성 및 실행
- [ ] UpdateSiteSettingsDto에 필드 추가
- [ ] SiteSettingsResponseDto에 필드 추가
- [ ] PublicSiteSettingsResponseDto에 필드 추가
- [ ] SiteService.updateSettings() 메서드 수정
- [ ] SiteService.toSettingsResponsePublic() 메서드 수정
- [ ] SiteService.toPublicSettingsResponse() 메서드 수정
- [ ] API 동작 테스트

## 테스트 계획

- [ ] 마이그레이션 정상 실행 확인
- [ ] PUT API로 키값 저장 테스트
- [ ] GET API로 키값 조회 테스트
- [ ] 공개 API에서 키값 노출 확인
- [ ] null 값 저장/조회 테스트

## 참고 자료

- 기존 SEO 필드 구현: `src/site/entities/site.entity.ts`
- 설정 DTO 패턴: `src/site/dto/update-site-settings.dto.ts`
