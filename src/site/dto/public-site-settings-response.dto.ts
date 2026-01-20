/**
 * 공개 API용 Site Settings 응답 DTO
 * 민감하지 않은 필드만 포함
 */
export class PublicSiteSettingsResponseDto {
  // 기본 정보
  name: string;
  slug: string;

  // 브랜딩
  logo_image_url: string | null;
  favicon_url: string | null;

  // SEO
  og_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  canonical_base_url: string | null;
  robots_index: boolean;

  // 연락처 (공개)
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;

  // 소셜 링크 (공개)
  kakao_channel_url: string | null;
  naver_map_url: string | null;
  instagram_url: string | null;

  // 사업자 정보 (공개)
  business_number: string | null;
  business_name: string | null;
  representative_name: string | null;
}
