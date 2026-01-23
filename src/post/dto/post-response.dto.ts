import { PostStatus } from '../entities/post.entity';

export class AdjacentPostDto {
  id: string;
  title: string;
  slug: string;
  ogImageUrl: string | null;
  publishedAt: Date;
  isCurrent: boolean;

  constructor(partial: Partial<AdjacentPostDto>) {
    Object.assign(this, partial);
  }
}

export class PostResponseDto {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  content: string | null; // Deprecated: 하위 호환성
  contentJson: Record<string, any> | null;
  contentHtml: string | null;
  contentText: string | null;
  status: string;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  categoryId: string | null;
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
  content: string | null; // Deprecated: 하위 호환성
  contentJson: Record<string, any> | null;
  contentHtml: string | null;
  contentText: string | null;
  publishedAt: Date;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  adjacentPosts?: AdjacentPostDto[];

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
