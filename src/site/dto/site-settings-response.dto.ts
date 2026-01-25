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
  canonicalBaseUrl: string;
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

  // 폰트 설정
  fontKey: string | null;

  // 검색 엔진 인증
  naverSearchAdvisorKey: string | null;

  // CTA 설정
  ctaEnabled: boolean;
  ctaType: string | null;
  ctaText: string | null;
  ctaImageUrl: string | null;
  ctaLink: string | null;
}
