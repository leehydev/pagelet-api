export class CategoryResponseDto {
  id: string;
  siteId: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  postCount?: number; // 게시글 수 (선택적)

  constructor(partial: Partial<CategoryResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PublicCategoryResponseDto {
  slug: string;
  name: string;
  description: string | null;
  postCount?: number; // 게시글 수 (선택적)

  constructor(partial: Partial<PublicCategoryResponseDto>) {
    Object.assign(this, partial);
  }
}
