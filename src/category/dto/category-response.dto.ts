export class CategoryResponseDto {
  id: string;
  site_id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  post_count?: number; // 게시글 수 (선택적)

  constructor(partial: Partial<CategoryResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PublicCategoryResponseDto {
  slug: string;
  name: string;
  description: string | null;
  post_count?: number; // 게시글 수 (선택적)

  constructor(partial: Partial<PublicCategoryResponseDto>) {
    Object.assign(this, partial);
  }
}
