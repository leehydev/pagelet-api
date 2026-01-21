export class AdminSiteListResponseDto {
  id: string;
  name: string;
  slug: string;

  constructor(partial: Partial<AdminSiteListResponseDto>) {
    Object.assign(this, partial);
  }
}
