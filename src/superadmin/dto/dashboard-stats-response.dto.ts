export class DashboardStatsResponseDto {
  totalUsers: number;
  totalSites: number;
  totalPosts: number;
  pendingUsers: number;
  usersThisWeek: number;
  sitesThisWeek: number;
  postsThisWeek: number;
  storageUsedBytes: number;
  storageTotalBytes: number;

  constructor(partial: Partial<DashboardStatsResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DailyStatDto {
  date: string;
  count: number;

  constructor(partial: Partial<DailyStatDto>) {
    Object.assign(this, partial);
  }
}

export class DailyStatsResponseDto {
  users: DailyStatDto[];
  posts: DailyStatDto[];

  constructor(partial: Partial<DailyStatsResponseDto>) {
    Object.assign(this, partial);
  }
}

export class RecentSiteDto {
  id: string;
  slug: string;
  userId: string;
  createdAt: Date;

  constructor(partial: Partial<RecentSiteDto>) {
    Object.assign(this, partial);
  }
}

export class RecentSitesResponseDto {
  sites: RecentSiteDto[];

  constructor(partial: Partial<RecentSitesResponseDto>) {
    Object.assign(this, partial);
  }
}
