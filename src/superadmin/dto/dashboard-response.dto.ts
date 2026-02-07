import { DashboardSummaryDto } from './dashboard-summary.dto';
import { DailyStatsDto } from './daily-stats.dto';

export class DashboardResponseDto {
  summary: DashboardSummaryDto;
  dailySignups: DailyStatsDto[];
  dailyPosts: DailyStatsDto[];

  constructor(partial: Partial<DashboardResponseDto>) {
    Object.assign(this, partial);
  }
}
