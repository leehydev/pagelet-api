import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateDraftDto {
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
  @MaxLength(255, { message: 'slug는 최대 255자까지 가능합니다' })
  slug?: string;

  @IsOptional()
  contentJson?: Record<string, any>;

  @IsOptional()
  @IsString()
  contentHtml?: string;

  @IsOptional()
  @IsString()
  contentText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImageUrl?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
