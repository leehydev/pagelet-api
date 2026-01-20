import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUrl,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class UpdateSiteSettingsDto {
  // 브랜딩
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  logo_image_url?: string | null;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  favicon_url?: string | null;

  // SEO
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  og_image_url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seo_title?: string | null;

  @IsOptional()
  @IsString()
  seo_description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seo_keywords?: string | null;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  canonical_base_url?: string | null;

  @IsOptional()
  @IsBoolean()
  robots_index?: boolean;

  // 연락처
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이어야 합니다' })
  @MaxLength(255)
  contact_email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contact_phone?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  // 소셜 링크
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  kakao_channel_url?: string | null;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  naver_map_url?: string | null;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  instagram_url?: string | null;

  // 사업자 정보
  @IsOptional()
  @IsString()
  @MaxLength(20)
  business_number?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  business_name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  representative_name?: string | null;
}
