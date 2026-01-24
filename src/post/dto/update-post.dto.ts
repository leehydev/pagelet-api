import { IsString, MaxLength, IsOptional, IsIn, Matches, IsUrl, IsObject } from 'class-validator';
import { PostStatus } from '../entities/post.entity';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '제목은 최대 500자까지 가능합니다' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '부제목은 최대 500자까지 가능합니다' })
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Slug는 최대 255자까지 가능합니다' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug는 영소문자, 숫자, 하이픈만 사용 가능합니다',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  content?: string; // Deprecated: 하위 호환성을 위해 유지

  @IsOptional()
  @IsObject({ message: '내용(JSON)은 객체여야 합니다' })
  contentJson?: Record<string, any>;

  @IsOptional()
  @IsString()
  contentHtml?: string;

  @IsOptional()
  @IsString()
  contentText?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(PostStatus), { message: 'status는 PRIVATE 또는 PUBLISHED만 가능합니다' })
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'SEO 제목은 최대 255자까지 가능합니다' })
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'SEO 설명은 최대 500자까지 가능합니다' })
  seoDescription?: string;

  @IsOptional()
  @IsUrl({}, { message: '유효한 URL 형식이어야 합니다' })
  @MaxLength(500, { message: 'OG 이미지 URL은 최대 500자까지 가능합니다' })
  ogImageUrl?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
