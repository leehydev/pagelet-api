# [BE] CTA 설정 API

## GitHub 이슈
- **이슈 번호**: #41
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/41
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-app#46, pagelet-app#47

## 개요

블로그 하단에 표시할 CTA(Call-to-Action) 버튼 설정 기능 구현.
사이트 설정의 일부로 CTA 버튼의 활성화 여부, 타입, 텍스트/이미지, 링크를 관리한다.

## 작업 범위

### 포함
- Site 엔티티에 CTA 관련 필드 추가
- 마이그레이션 생성
- 기존 사이트 설정 API에서 CTA 필드 관리
- Public API에서 CTA 설정 조회

### 제외
- CTA 클릭 추적 (별도 이슈 #42)
- 프론트엔드 UI (pagelet-app#46)

## 기술 명세

### 영향받는 파일
- `src/site/entities/site.entity.ts`
- `src/site/dto/update-site-settings.dto.ts`
- `src/site/dto/site-settings-response.dto.ts`
- `src/database/migrations/`

### Site 엔티티 추가 필드

```typescript
// CTA 설정
@Column({ type: 'boolean', default: false })
ctaEnabled: boolean;

@Column({ type: 'varchar', length: 20, nullable: true })
ctaType: string | null; // 'text' | 'image'

@Column({ type: 'varchar', length: 100, nullable: true })
ctaText: string | null;

@Column({ type: 'varchar', length: 500, nullable: true })
ctaImageUrl: string | null;

@Column({ type: 'varchar', length: 500, nullable: true })
ctaLink: string | null;
```

### DTO 추가 필드

```typescript
// UpdateSiteSettingsDto
@IsOptional()
@IsBoolean()
ctaEnabled?: boolean;

@IsOptional()
@IsIn(['text', 'image'])
ctaType?: 'text' | 'image';

@IsOptional()
@IsString()
@MaxLength(100)
ctaText?: string;

@IsOptional()
@IsUrl()
ctaImageUrl?: string;

@IsOptional()
@IsUrl()
ctaLink?: string;
```

## 구현 체크리스트
- [ ] Site 엔티티에 CTA 필드 추가
- [ ] 마이그레이션 생성 (AddCtaFieldsToSite)
- [ ] UpdateSiteSettingsDto 업데이트
- [ ] SiteSettingsResponseDto 업데이트
- [ ] Public API 응답에 CTA 설정 포함

## 테스트 계획
- [ ] 마이그레이션 실행 확인
- [ ] Admin API로 CTA 설정 저장/조회
- [ ] Public API로 CTA 설정 조회
