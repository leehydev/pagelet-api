export class BannerPostDto {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  ogImageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  publishedAt: Date | null;

  constructor(partial: Partial<BannerPostDto>) {
    Object.assign(this, partial);
  }
}

export class BannerResponseDto {
  id: string;
  postId: string;
  post: BannerPostDto;
  isActive: boolean;
  startAt: Date | null;
  endAt: Date | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<BannerResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PublicBannerPostDto {
  title: string;
  subtitle: string;
  slug: string;
  ogImageUrl: string | null;
  categoryName: string | null;
  publishedAt: Date | null;

  constructor(partial: Partial<PublicBannerPostDto>) {
    Object.assign(this, partial);
  }
}

export class PublicBannerResponseDto {
  id: string;
  post: PublicBannerPostDto;
  displayOrder: number;

  constructor(partial: Partial<PublicBannerResponseDto>) {
    Object.assign(this, partial);
  }
}
