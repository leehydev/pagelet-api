/**
 * Kakao 사용자 정보 응답 DTO
 * 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#req-user-info
 */
export class KakaoAccountDto {
  profile_nickname_needs_agreement?: boolean;
  profile_image_needs_agreement?: boolean;
  profile?: {
    nickname?: string;
    thumbnail_image_url?: string;
    profile_image_url?: string;
    is_default_image?: boolean;
  };
  has_email?: boolean;
  email_needs_agreement?: boolean;
  is_email_valid?: boolean;
  is_email_verified?: boolean;
  email?: string;
  has_age_range?: boolean;
  age_range_needs_agreement?: boolean;
  age_range?: string;
  has_birthday?: boolean;
  birthday_needs_agreement?: boolean;
  birthday?: string;
  birthday_type?: string;
  has_gender?: boolean;
  gender_needs_agreement?: boolean;
  gender?: string;
}

export class KakaoUserInfoDto {
  id: number;
  connected_at?: string;
  synched_at?: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: KakaoAccountDto;
}
