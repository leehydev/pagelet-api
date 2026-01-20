import { PostStatus } from '../entities/post.entity';

export class PostResponseDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  published_at: Date | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  created_at: Date;
  updated_at: Date;

  constructor(partial: Partial<PostResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PublicPostResponseDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  published_at: Date;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;

  constructor(partial: Partial<PublicPostResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PostListResponseDto {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: Date | null;
  seo_description: string | null;
  og_image_url: string | null;
  created_at: Date;

  constructor(partial: Partial<PostListResponseDto>) {
    Object.assign(this, partial);
  }
}
