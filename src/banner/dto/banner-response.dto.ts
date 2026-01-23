export class BannerResponseDto {
  id: string;
  siteId: string;
  imageUrl: string;
  linkUrl: string | null;
  openInNewTab: boolean;
  isActive: boolean;
  startAt: Date | null;
  endAt: Date | null;
  displayOrder: number;
  altText: string | null;
  deviceType: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<BannerResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PublicBannerResponseDto {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  openInNewTab: boolean;
  altText: string | null;
  displayOrder: number;

  constructor(partial: Partial<PublicBannerResponseDto>) {
    Object.assign(this, partial);
  }
}
