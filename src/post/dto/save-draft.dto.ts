import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SaveDraftDto {
  @ApiPropertyOptional({ description: '제목', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '제목은 최대 500자까지 가능합니다' })
  title?: string;

  @ApiPropertyOptional({ description: '부제목', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '부제목은 최대 500자까지 가능합니다' })
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Slug (URL 경로)', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Slug는 최대 255자까지 가능합니다' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug는 영소문자, 숫자, 하이픈만 사용 가능합니다',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'Tiptap 에디터 JSON 데이터' })
  @IsOptional()
  contentJson?: Record<string, any>;

  @ApiPropertyOptional({ description: '렌더링용 HTML' })
  @IsOptional()
  @IsString()
  contentHtml?: string;

  @ApiPropertyOptional({ description: '검색/미리보기용 텍스트' })
  @IsOptional()
  @IsString()
  contentText?: string;

  @ApiPropertyOptional({ description: 'SEO 제목', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'SEO 제목은 최대 255자까지 가능합니다' })
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO 설명', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'SEO 설명은 최대 500자까지 가능합니다' })
  seoDescription?: string;

  @ApiPropertyOptional({ description: 'OG 이미지 URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'OG 이미지 URL은 최대 500자까지 가능합니다' })
  ogImageUrl?: string;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @IsOptional()
  @IsUUID('4', { message: '유효한 카테고리 ID가 아닙니다' })
  categoryId?: string;
}
