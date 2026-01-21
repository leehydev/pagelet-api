export class SiteSettingsResponseDto {
  // 기본 정보
  id: string;
  name: string;
  slug: string;
  updatedAt: Date;

  // 브랜딩
  logoImageUrl: string | null;
  faviconUrl: string | null;

  // SEO
  ogImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  canonicalBaseUrl: string | null;
  robotsIndex: boolean;

  // 연락처
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;

  // 소셜 링크
  kakaoChannelUrl: string | null;
  naverMapUrl: string | null;
  instagramUrl: string | null;

  // 사업자 정보
  businessNumber: string | null;
  businessName: string | null;
  representativeName: string | null;
}
