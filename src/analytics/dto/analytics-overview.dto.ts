export class AnalyticsOverviewDto {
  totalViews: number;
  uniqueVisitors: number;
  todayVisitors: number;
  yesterdayVisitors: number;
  totalCtaClicks: number;
  todayCtaClicks: number;

  constructor(partial: Partial<AnalyticsOverviewDto>) {
    Object.assign(this, partial);
  }
}
