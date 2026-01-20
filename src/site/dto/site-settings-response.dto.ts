export class SiteSettingsResponseDto {
  // 기본 정보
  id: string;
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

  // 연락처
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;

  // 소셜 링크
  kakao_channel_url: string | null;
  naver_map_url: string | null;
  instagram_url: string | null;

  // 사업자 정보
  business_number: string | null;
  business_name: string | null;
  representative_name: string | null;
}
