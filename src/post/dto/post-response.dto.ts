import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjacentPostDto {
  @ApiProperty({ description: '게시글 ID' })
  id: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: 'URL slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'OG 이미지 URL' })
  ogImageUrl: string | null;

  @ApiProperty({ description: '발행일' })
  publishedAt: Date;

  @ApiProperty({ description: '현재 게시글 여부' })
  isCurrent: boolean;

  constructor(partial: Partial<AdjacentPostDto>) {
    Object.assign(this, partial);
  }
}

export class PostResponseDto {
  @ApiProperty({ description: '게시글 ID' })
  id: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '부제목' })
  subtitle: string;

  @ApiProperty({ description: 'URL slug' })
  slug: string;

  @ApiPropertyOptional({ description: '(Deprecated) 레거시 컨텐츠 필드' })
  content: string | null; // Deprecated: 하위 호환성

  @ApiPropertyOptional({ description: 'Tiptap 에디터 JSON 데이터' })
  contentJson: Record<string, any> | null;

  @ApiPropertyOptional({ description: '렌더링용 HTML' })
  contentHtml: string | null;

  @ApiPropertyOptional({ description: '검색/미리보기용 텍스트' })
  contentText: string | null;

  @ApiProperty({ description: '상태 (DRAFT, PUBLISHED, PRIVATE)' })
  status: string;

  @ApiPropertyOptional({ description: '발행일' })
  publishedAt: Date | null;

  @ApiPropertyOptional({ description: 'SEO 제목' })
  seoTitle: string | null;

  @ApiPropertyOptional({ description: 'SEO 설명' })
  seoDescription: string | null;

  @ApiPropertyOptional({ description: 'OG 이미지 URL' })
  ogImageUrl: string | null;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  categoryId: string | null;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '드래프트 존재 여부' })
  hasDraft?: boolean;

  constructor(partial: Partial<PostResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PublicPostResponseDto {
  @ApiProperty({ description: '게시글 ID' })
  id: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '부제목' })
  subtitle: string;

  @ApiProperty({ description: 'URL slug' })
  slug: string;

  @ApiPropertyOptional({ description: '(Deprecated) 레거시 컨텐츠 필드' })
  content: string | null; // Deprecated: 하위 호환성

  @ApiPropertyOptional({ description: 'Tiptap 에디터 JSON 데이터' })
  contentJson: Record<string, any> | null;

  @ApiPropertyOptional({ description: '렌더링용 HTML' })
  contentHtml: string | null;

  @ApiPropertyOptional({ description: '검색/미리보기용 텍스트' })
  contentText: string | null;

  @ApiProperty({ description: '발행일' })
  publishedAt: Date;

  @ApiPropertyOptional({ description: 'SEO 제목' })
  seoTitle: string | null;

  @ApiPropertyOptional({ description: 'SEO 설명' })
  seoDescription: string | null;

  @ApiPropertyOptional({ description: 'OG 이미지 URL' })
  ogImageUrl: string | null;

  @ApiPropertyOptional({ description: '카테고리 이름' })
  categoryName: string | null;

  @ApiPropertyOptional({ description: '카테고리 slug' })
  categorySlug: string | null;

  @ApiPropertyOptional({ description: '인접 게시글 목록', type: [AdjacentPostDto] })
  adjacentPosts?: AdjacentPostDto[];

  constructor(partial: Partial<PublicPostResponseDto>) {
    Object.assign(this, partial);
  }
}

export class PostListResponseDto {
  @ApiProperty({ description: '게시글 ID' })
  id: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '부제목' })
  subtitle: string;

  @ApiProperty({ description: 'URL slug' })
  slug: string;

  @ApiProperty({ description: '상태 (DRAFT, PUBLISHED, PRIVATE)' })
  status: string;

  @ApiPropertyOptional({ description: '발행일' })
  publishedAt: Date | null;

  @ApiPropertyOptional({ description: 'SEO 설명' })
  seoDescription: string | null;

  @ApiPropertyOptional({ description: 'OG 이미지 URL' })
  ogImageUrl: string | null;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  categoryId: string | null;

  @ApiPropertyOptional({ description: '카테고리 이름' })
  categoryName: string | null;

  @ApiPropertyOptional({ description: '드래프트 존재 여부' })
  hasDraft?: boolean;

  constructor(partial: Partial<PostListResponseDto>) {
    Object.assign(this, partial);
  }
}
