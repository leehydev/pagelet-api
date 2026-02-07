export class DailyStatsDto {
  date: string; // YYYY-MM-DD
  count: number;

  constructor(partial: Partial<DailyStatsDto>) {
    Object.assign(this, partial);
  }
}
