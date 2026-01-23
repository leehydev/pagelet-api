import { IsString, IsBoolean, IsOptional, IsUrl, IsEmail, MaxLength, IsIn } from 'class-validator';

export class UpdateSiteSettingsDto {
  // 브랜딩
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  logoImageUrl?: string | null;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  faviconUrl?: string | null;

  // SEO
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  ogImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoKeywords?: string | null;

  @IsOptional()
  @IsBoolean()
  robotsIndex?: boolean;

  // 연락처
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이어야 합니다' })
  @MaxLength(255)
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  // 소셜 링크
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  kakaoChannelUrl?: string | null;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  naverMapUrl?: string | null;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  instagramUrl?: string | null;

  // 사업자 정보
  @IsOptional()
  @IsString()
  @MaxLength(20)
  businessNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  representativeName?: string | null;

  // 폰트 설정
  @IsOptional()
  @IsIn(['noto_sans', 'noto_serif', null], {
    message: 'fontKey는 noto_sans, noto_serif 또는 null이어야 합니다',
  })
  fontKey?: 'noto_sans' | 'noto_serif' | null;

  // CTA 설정
  @IsOptional()
  @IsBoolean()
  ctaEnabled?: boolean;

  @IsOptional()
  @IsIn(['text', 'image', null], {
    message: 'ctaType은 text, image 또는 null이어야 합니다',
  })
  ctaType?: 'text' | 'image' | null;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'CTA 텍스트는 최대 100자까지 가능합니다' })
  ctaText?: string | null;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  ctaImageUrl?: string | null;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  @MaxLength(500)
  ctaLink?: string | null;
}
