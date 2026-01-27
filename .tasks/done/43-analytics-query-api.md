# [BE] 통계 조회 API (대시보드)

## GitHub 이슈

- **이슈 번호**: #43
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/43
- **생성일**: 2026-01-23
- **우선순위**: 중간
- **관련 태스크**: pagelet-api#42 (의존), pagelet-app#48

## 개요

관리자 대시보드에서 사용할 통계 조회 API 구현.
PageView, CtaClick 데이터를 집계하여 반환한다.

## 의존성

- pagelet-api#42 (통계 추적 API) 완료 후 진행

## 작업 범위

### 포함

- Admin API: 통계 데이터 조회
- 대시보드 요약 통계 (overview)
- 게시글별 상세 통계 (posts)
- 일별 추이 데이터 (daily)

### 제외

- 통계 추적 (이슈 #42)
- 프론트엔드 대시보드 UI (pagelet-app#48)

## 기술 명세

### 영향받는 파일

- `src/analytics/admin-analytics.controller.ts`
- `src/analytics/analytics.service.ts`
- `src/analytics/dto/analytics-overview.dto.ts`
- `src/analytics/dto/post-analytics.dto.ts`
- `src/analytics/dto/daily-analytics.dto.ts`

### API 엔드포인트

```typescript
@Controller('admin/sites/:siteId/analytics')
@UseGuards(AdminSiteGuard)
export class AdminAnalyticsController {
  @Get('overview')
  getOverview(@CurrentSite() site: Site): Promise<AnalyticsOverviewDto> {}

  @Get('posts')
  getPostsAnalytics(@CurrentSite() site: Site): Promise<PostAnalyticsDto[]> {}

  @Get('daily')
  getDailyAnalytics(
    @CurrentSite() site: Site,
    @Query('days') days: number = 7,
  ): Promise<DailyAnalyticsDto[]> {}
}
```

### Response DTO

```typescript
export class AnalyticsOverviewDto {
  totalViews: number;
  uniqueVisitors: number;
  todayVisitors: number;
  yesterdayVisitors: number;
  totalCtaClicks: number;
  todayCtaClicks: number;
}

export class PostAnalyticsDto {
  postId: string;
  title: string;
  views: number;
  uniqueVisitors: number;
  ctaClicks: number;
}

export class DailyAnalyticsDto {
  date: string; // YYYY-MM-DD
  views: number;
  visitors: number;
  ctaClicks: number;
}
```

### 쿼리 예시

```sql
-- 총 조회수
SELECT COUNT(*) FROM page_views WHERE site_id = :siteId;

-- 고유 방문자
SELECT COUNT(DISTINCT visitor_id) FROM page_views WHERE site_id = :siteId;

-- 오늘 방문자
SELECT COUNT(DISTINCT visitor_id) FROM page_views
WHERE site_id = :siteId AND viewed_at >= CURRENT_DATE;

-- 게시글별 통계
SELECT
  p.id, p.title,
  COUNT(pv.id) as views,
  COUNT(DISTINCT pv.visitor_id) as visitors,
  COUNT(cc.id) as cta_clicks
FROM posts p
LEFT JOIN page_views pv ON pv.post_id = p.id
LEFT JOIN cta_clicks cc ON cc.post_id = p.id
WHERE p.site_id = :siteId
GROUP BY p.id;
```

## 구현 체크리스트

- [ ] AnalyticsOverviewDto 생성
- [ ] PostAnalyticsDto 생성
- [ ] DailyAnalyticsDto 생성
- [ ] AdminAnalyticsController 구현
- [ ] AnalyticsService에 조회 메서드 추가
- [ ] AdminSiteGuard 적용

## 테스트 계획

- [ ] overview API 테스트
- [ ] posts API 테스트
- [ ] daily API 테스트 (days 파라미터)
- [ ] 권한 검증 테스트 (다른 사이트 접근 불가)
