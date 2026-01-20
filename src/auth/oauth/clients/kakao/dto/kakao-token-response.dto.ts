/**
 * Kakao OAuth Token 응답 DTO
 * 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#request-token
 */
export class KakaoTokenResponseDto {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  scope?: string;
}
