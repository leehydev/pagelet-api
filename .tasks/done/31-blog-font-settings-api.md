# [BE] 블로그 폰트 설정 API 구현

## GitHub 이슈

- **이슈 번호**: #31
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/31
- **생성일**: 2026-01-23
- **우선순위**: 중간
- **관련 태스크**: leehydev/pagelet-app#37 (프론트엔드)

## 개요

사용자가 블로그에 적용할 폰트를 선택할 수 있도록 Site 설정에 폰트 필드를 추가합니다.

## 작업 범위

### 포함

- Site 엔티티에 `fontKey` 필드 추가
- 관련 DTO 수정
- DB 마이그레이션

### 제외

- 폰트 파일 업로드 기능 (추후 확장 가능)
- Google Fonts 외 커스텀 폰트 지원

## 기술 명세

### 영향받는 파일

- `src/site/entities/site.entity.ts`
- `src/site/dto/update-site-settings.dto.ts`
- `src/site/dto/site-settings-response.dto.ts`
- `src/site/dto/public-site-settings-response.dto.ts`

### 타입 정의

```typescript
// Site 엔티티
@Column({ type: 'varchar', length: 20, nullable: true, default: null })
fontKey: string | null; // 'noto_sans' | 'noto_serif'

// DTO
fontKey?: 'noto_sans' | 'noto_serif' | null;
```

### API 변경사항

**PATCH /admin/sites/:siteId/settings**

- Request Body에 `fontKey` 필드 추가
- 유효값: `'noto_sans'`, `'noto_serif'`, `null`

**GET /admin/sites/:siteId/settings**

- Response에 `fontKey` 필드 추가

**GET /public/sites/:slug/settings**

- Response에 `fontKey` 필드 추가

## 구현 체크리스트

- [ ] Site 엔티티에 `fontKey` 컬럼 추가
- [ ] `update-site-settings.dto.ts`에 `fontKey` 필드 추가 (class-validator 데코레이터 포함)
- [ ] `site-settings-response.dto.ts`에 `fontKey` 필드 추가
- [ ] `public-site-settings-response.dto.ts`에 `fontKey` 필드 추가
- [ ] DB 마이그레이션 생성 및 실행
- [ ] API 테스트

## 테스트 계획

- [ ] PATCH로 `fontKey` 업데이트 테스트
- [ ] 유효하지 않은 `fontKey` 값 거부 테스트
- [ ] GET 응답에 `fontKey` 포함 확인

## 참고 자료

- 기존 Site 엔티티: `src/site/entities/site.entity.ts`
- 기존 DTO 패턴: `src/site/dto/`
