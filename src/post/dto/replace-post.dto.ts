import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '../entities/post.entity';

/**
 * ReplacePostDto
 * PUT /posts/:id 전체 교체용 DTO
 * 모든 필수 필드를 받아서 게시글을 완전히 덮어씀
 */
export class ReplacePostDto {
  @ApiProperty({ description: '제목', maxLength: 500 })
  @IsString()
  @IsNotEmpty({ message: '제목은 필수입니다' })
  @MaxLength(500, { message: '제목은 최대 500자까지 가능합니다' })
  title: string;

  @ApiProperty({ description: '부제목', maxLength: 500 })
  @IsString()
  @IsNotEmpty({ message: '부제목은 필수입니다' })
  @MaxLength(500, { message: '부제목은 최대 500자까지 가능합니다' })
  subtitle: string;

  @ApiPropertyOptional({ description: 'Slug (URL 경로), null이면 자동생성', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Slug는 최대 255자까지 가능합니다' })
  slug?: string | null;

  @ApiProperty({ description: 'Tiptap 에디터 JSON 데이터' })
  @IsObject()
  @IsNotEmpty({ message: 'contentJson은 필수입니다' })
  contentJson: Record<string, unknown>;

  @ApiPropertyOptional({ description: '렌더링용 HTML' })
  @IsOptional()
  @IsString()
  contentHtml?: string | null;

  @ApiPropertyOptional({ description: '검색/미리보기용 텍스트' })
  @IsOptional()
  @IsString()
  contentText?: string | null;

  @ApiProperty({ description: '게시글 상태', enum: PostStatus })
  @IsEnum(PostStatus, { message: 'status는 PRIVATE 또는 PUBLISHED여야 합니다' })
  status: PostStatus;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ description: 'SEO 제목', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'SEO 제목은 최대 255자까지 가능합니다' })
  seoTitle?: string | null;

  @ApiPropertyOptional({ description: 'SEO 설명', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'SEO 설명은 최대 500자까지 가능합니다' })
  seoDescription?: string | null;

  @ApiPropertyOptional({ description: 'OG 이미지 URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'OG 이미지 URL은 최대 500자까지 가능합니다' })
  ogImageUrl?: string | null;
}
