export class PostAnalyticsDto {
  postId: string;
  title: string;
  views: number;
  uniqueVisitors: number;
  ctaClicks: number;

  constructor(partial: Partial<PostAnalyticsDto>) {
    Object.assign(this, partial);
  }
}
