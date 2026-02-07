export class DashboardSummaryDto {
  totalUsers: number;
  weeklyNewUsers: number;
  totalSites: number;
  weeklyNewSites: number;
  totalPosts: number;
  weeklyNewPosts: number;
  pendingUsers: number;

  constructor(partial: Partial<DashboardSummaryDto>) {
    Object.assign(this, partial);
  }
}
