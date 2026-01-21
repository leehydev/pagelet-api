import { PostStatus } from '../entities/post.entity';

export class PostResponseDto {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  status: string;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PostResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PublicPostResponseDto {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  publishedAt: Date;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;

  constructor(partial: Partial<PublicPostResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PostListResponseDto {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  status: string;
  publishedAt: Date | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  createdAt: Date;
  categoryId: string | null;
  categoryName: string | null;

  constructor(partial: Partial<PostListResponseDto>) {
    Object.assign(this, partial);
  }
}
