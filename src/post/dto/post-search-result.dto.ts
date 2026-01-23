export class PostSearchResultDto {
  id: string;
  title: string;
  subtitle: string;
  ogImageUrl: string | null;
  categoryName: string | null;
  publishedAt: Date | null;
  status: string;

  constructor(partial: Partial<PostSearchResultDto>) {
    Object.assign(this, partial);
  }
}
