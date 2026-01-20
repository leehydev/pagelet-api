import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsIn,
  Matches,
  IsUrl,
} from 'class-validator';
import { PostStatus } from '../entities/post.entity';

export class CreatePostDto {
  @IsNotEmpty({ message: '제목은 필수입니다' })
  @IsString()
  @MaxLength(500, { message: '제목은 최대 500자까지 가능합니다' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Slug는 최대 255자까지 가능합니다' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug는 영소문자, 숫자, 하이픈만 사용 가능합니다',
  })
  slug?: string;

  @IsNotEmpty({ message: '내용은 필수입니다' })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(PostStatus), { message: 'status는 DRAFT 또는 PUBLISHED만 가능합니다' })
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'SEO 제목은 최대 255자까지 가능합니다' })
  seo_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'SEO 설명은 최대 500자까지 가능합니다' })
  seo_description?: string;

  @IsOptional()
  @IsUrl({}, { message: '유효한 URL 형식이어야 합니다' })
  @MaxLength(500, { message: 'OG 이미지 URL은 최대 500자까지 가능합니다' })
  og_image_url?: string;
}
