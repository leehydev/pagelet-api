# [BE] 통계 추적 API (PageView, CtaClick)

## GitHub 이슈
- **이슈 번호**: #42
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/42
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-api#43, pagelet-app#47

## 개요

페이지 조회수와 CTA 클릭을 추적하는 analytics 모듈 구현.
프론트엔드에서 호출하는 Public API로 추적 데이터를 저장한다.

## 작업 범위

### 포함
- analytics 모듈 생성
- PageView 엔티티 및 마이그레이션
- CtaClick 엔티티 및 마이그레이션
- Public API: 추적 데이터 저장
- 중복 조회 방지 로직

### 제외
- 통계 조회 API (별도 이슈 #43)
- 프론트엔드 추적 로직 (pagelet-app#47)

## 기술 명세

### 영향받는 파일
- `src/analytics/` (새 모듈)
- `src/analytics/entities/page-view.entity.ts`
- `src/analytics/entities/cta-click.entity.ts`
- `src/analytics/dto/track-pageview.dto.ts`
- `src/analytics/dto/track-cta-click.dto.ts`
- `src/analytics/public-analytics.controller.ts`
- `src/analytics/analytics.service.ts`
- `src/analytics/analytics.module.ts`
- `src/database/migrations/`
- `src/app.module.ts`

### PageView 엔티티

```typescript
@Entity('page_views')
@Index(['siteId', 'viewedAt'])
@Index(['postId', 'viewedAt'])
export class PageView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'uuid', nullable: true })
  postId: string | null; // null이면 메인페이지

  @Column({ type: 'varchar', length: 64 })
  visitorId: string; // 익명 방문자 식별자

  @CreateDateColumn({ type: 'timestamptz' })
  viewedAt: Date;
}
```

### CtaClick 엔티티

```typescript
@Entity('cta_clicks')
@Index(['siteId', 'clickedAt'])
export class CtaClick {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  siteId: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'uuid', nullable: true })
  postId: string | null; // 클릭 발생 페이지

  @Column({ type: 'varchar', length: 64 })
  visitorId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  clickedAt: Date;
}
```

### API 엔드포인트

```typescript
@Controller('public/analytics')
@Public()
export class PublicAnalyticsController {
  @Post('pageview')
  trackPageview(@Body() dto: TrackPageviewDto) { }

  @Post('cta-click')
  trackCtaClick(@Body() dto: TrackCtaClickDto) { }
}
```

### DTO

```typescript
export class TrackPageviewDto {
  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsString()
  @MaxLength(64)
  visitorId: string;
}

export class TrackCtaClickDto {
  @IsUUID()
  siteId: string;

  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsString()
  @MaxLength(64)
  visitorId: string;
}
```

### 중복 방지 로직

같은 visitorId가 같은 페이지를 5분 이내 재조회 시 중복 기록하지 않음.
Redis 또는 메모리 캐시로 최근 조회 기록 관리.

## 구현 체크리스트
- [ ] analytics 모듈 생성
- [ ] PageView 엔티티 생성
- [ ] CtaClick 엔티티 생성
- [ ] 마이그레이션 생성 (CreateAnalyticsTables)
- [ ] TrackPageviewDto, TrackCtaClickDto 생성
- [ ] PublicAnalyticsController 구현
- [ ] AnalyticsService 구현
- [ ] 중복 조회 방지 로직 구현
- [ ] AppModule에 AnalyticsModule 등록

## 테스트 계획
- [ ] 마이그레이션 실행 확인
- [ ] pageview 추적 API 테스트
- [ ] cta-click 추적 API 테스트
- [ ] 중복 방지 로직 테스트
