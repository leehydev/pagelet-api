/**
 * 공개 API용 Site Settings 응답 DTO
 * 민감하지 않은 필드만 포함
 */
export class PublicSiteSettingsResponseDto {
  // 기본 정보
  name: string;
  slug: string;

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

  // 연락처 (공개)
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;

  // 소셜 링크 (공개)
  kakaoChannelUrl: string | null;
  naverMapUrl: string | null;
  instagramUrl: string | null;

  // 사업자 정보 (공개)
  businessNumber: string | null;
  businessName: string | null;
  representativeName: string | null;

  // 폰트 설정
  fontKey: string | null;
}
