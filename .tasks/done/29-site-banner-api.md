# [BE] 사이트 배너 기능 API 구현

## GitHub 이슈
- **이슈 번호**: #29
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/29
- **생성일**: 2025-01-23
- **우선순위**: 높음
- **관련 태스크**: leehydev/pagelet-app#35 (프론트엔드)

## 개요

사이트에 표시할 배너 이미지를 관리하는 API를 구현합니다.
데스크톱/모바일 배너를 분리하여 관리하며, 시작/종료 시간 설정 및 순서 변경 기능을 제공합니다.

## 작업 범위

### 포함
- site_banners 테이블 생성 (마이그레이션)
- SiteBanner Entity 정의
- BannerService 구현 (CRUD + 순서 변경)
- Admin API 엔드포인트 구현
- Public API 엔드포인트 구현
- 파일 업로드를 위한 Presign URL 발급 API

### 제외
- 프론트엔드 UI (pagelet-app#35에서 진행)

## 기술 명세

### 영향받는 파일

**신규 생성:**
- `src/banner/` - 배너 모듈 디렉토리
  - `banner.module.ts`
  - `banner.service.ts`
  - `admin-banner.controller.ts`
  - `public-banner.controller.ts`
  - `entities/site-banner.entity.ts`
  - `dto/index.ts`
  - `dto/banner-presign.dto.ts`
  - `dto/create-banner.dto.ts`
  - `dto/update-banner.dto.ts`
  - `dto/update-banner-order.dto.ts`
  - `dto/banner-response.dto.ts`
  - `claude.md`
- `src/database/migrations/1737600000000-AddSiteBannersTable.ts`

**수정:**
- `src/app.module.ts` - BannerModule import
- `src/common/exception/error-code.ts` - ErrorCode 추가

### 테이블 구조 (site_banners)

```sql
CREATE TABLE site_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  open_in_new_tab BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  display_order INT DEFAULT 0,
  alt_text VARCHAR(255),
  device_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_site_banners_site_id ON site_banners(site_id);
CREATE INDEX idx_site_banners_device_type ON site_banners(site_id, device_type);
```

### API 엔드포인트

#### Admin API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/admin/sites/:siteId/banners/presign` | 업로드 URL 발급 |
| POST | `/admin/sites/:siteId/banners` | 배너 생성 |
| GET | `/admin/sites/:siteId/banners` | 배너 목록 (deviceType 쿼리) |
| GET | `/admin/sites/:siteId/banners/:id` | 배너 상세 |
| PUT | `/admin/sites/:siteId/banners/:id` | 배너 수정 |
| DELETE | `/admin/sites/:siteId/banners/:id` | 배너 삭제 |
| PUT | `/admin/sites/:siteId/banners/order` | 순서 변경 |

#### Public API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/public/banners?siteSlug=xxx&deviceType=desktop` | 활성 배너 조회 |

### 타입 정의

```typescript
// Device Type
export const DeviceType = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
} as const;
export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType];

// Entity
@Entity('site_banners')
export class SiteBanner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkUrl: string | null;

  @Column({ type: 'boolean', default: true })
  openInNewTab: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  altText: string | null;

  @Column({ type: 'varchar', length: 20 })
  deviceType: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### DTO 정의

```typescript
// BannerPresignDto
export class BannerPresignDto {
  @IsString()
  filename: string;

  @IsNumber()
  size: number;

  @IsString()
  mimeType: string;
}

// CreateBannerDto
export class CreateBannerDto {
  @IsString()
  @MaxLength(500)
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^https?:\/\//, { message: 'http 또는 https URL만 허용됩니다' })
  linkUrl?: string;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @IsString()
  @IsIn(['desktop', 'mobile'])
  deviceType: string;
}

// UpdateBannerDto (모든 필드 optional)
// UpdateBannerOrderDto
export class UpdateBannerOrderDto {
  @IsArray()
  @IsUUID('4', { each: true })
  bannerIds: string[];

  @IsString()
  @IsIn(['desktop', 'mobile'])
  deviceType: string;
}
```

### ErrorCode 추가

```typescript
// src/common/exception/error-code.ts
BANNER_NOT_FOUND: new ErrorCodeDefinition(
  'BANNER_001',
  HttpStatus.NOT_FOUND,
  '배너를 찾을 수 없습니다',
),
BANNER_LIMIT_EXCEEDED: new ErrorCodeDefinition(
  'BANNER_002',
  HttpStatus.BAD_REQUEST,
  '배너는 최대 5개까지 등록할 수 있습니다',
),
BANNER_INVALID_LINK: new ErrorCodeDefinition(
  'BANNER_003',
  HttpStatus.BAD_REQUEST,
  '유효하지 않은 링크 URL입니다',
),
```

### 제약사항

- 파일 크기: 5MB 제한
- 권장 크기: 1280px 너비, 세로 300~500px
- MIME: image/png, image/jpeg, image/webp
- 사이트당 배너 최대 5개 (device_type별 각각)
- link_url: http/https 프로토콜만 허용 (XSS 방지)

## 구현 체크리스트

- [ ] 마이그레이션 파일 작성 (`1737600000000-AddSiteBannersTable.ts`)
- [ ] SiteBanner Entity 정의
- [ ] DeviceType const object 정의
- [ ] BannerService 구현
  - [ ] presign() - Presign URL 발급
  - [ ] create() - 배너 생성 (최대 5개 검증)
  - [ ] findBySiteId() - 목록 조회
  - [ ] findById() - 상세 조회
  - [ ] update() - 수정
  - [ ] delete() - 삭제
  - [ ] updateOrder() - 순서 변경
  - [ ] findActiveBySlug() - Public용 활성 배너 조회
- [ ] DTO 작성
  - [ ] BannerPresignDto
  - [ ] CreateBannerDto
  - [ ] UpdateBannerDto
  - [ ] UpdateBannerOrderDto
  - [ ] BannerResponseDto
  - [ ] PublicBannerResponseDto
  - [ ] BannerPresignResponseDto
- [ ] AdminBannerController 구현
- [ ] PublicBannerController 구현
- [ ] BannerModule 생성 및 AppModule에 등록
- [ ] ErrorCode 추가
- [ ] claude.md 문서 작성
- [ ] npm run build 성공
- [ ] npm run lint 통과
- [ ] npm run test 통과

## 테스트 계획

- [ ] 배너 생성 API 테스트
- [ ] 배너 목록 조회 테스트 (deviceType 필터)
- [ ] 배너 수정 API 테스트
- [ ] 배너 삭제 API 테스트
- [ ] 순서 변경 API 테스트
- [ ] Public API 필터링 테스트 (활성/기간 조건)
- [ ] 파일 업로드 presign 테스트
- [ ] 최대 5개 제한 테스트
- [ ] 권한 검증 테스트 (AdminSiteGuard)

## 참고 자료

- 기존 BrandingAssetService 패턴: `src/storage/branding-asset.service.ts`
- AdminCategoryController 구조: `src/category/admin-category.controller.ts`
- PublicPostController siteSlug 쿼리 파라미터 패턴: `src/post/public-post.controller.ts`
- S3Service presign 메서드: `src/storage/s3.service.ts`
