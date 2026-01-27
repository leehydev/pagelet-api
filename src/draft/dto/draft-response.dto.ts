export class DraftResponseDto {
  id: string;
  siteId: string;
  userId: string;
  title: string;
  subtitle: string;
  slug: string | null;
  contentJson: Record<string, any> | null;
  contentHtml: string | null;
  contentText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  categoryId: string | null;
  categoryName?: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<DraftResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DraftListResponseDto {
  id: string;
  title: string;
  subtitle: string;
  ogImageUrl: string | null;
  categoryName: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<DraftListResponseDto>) {
    Object.assign(this, partial);
  }
}
