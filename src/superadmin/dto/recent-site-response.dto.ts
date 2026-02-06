export class RecentSiteResponseDto {
  id: string;
  slug: string;
  name: string;
  userId: string;
  userName: string | null;
  createdAt: Date;

  constructor(partial: Partial<RecentSiteResponseDto>) {
    Object.assign(this, partial);
  }
}
