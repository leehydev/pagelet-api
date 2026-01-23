export class DailyAnalyticsDto {
  date: string; // YYYY-MM-DD
  views: number;
  visitors: number;
  ctaClicks: number;

  constructor(partial: Partial<DailyAnalyticsDto>) {
    Object.assign(this, partial);
  }
}
