/**
 * Naver OAuth Token 응답 DTO
 * 참고: https://developers.naver.com/docs/login/api/api.md
 */
export class NaverTokenResponseDto {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
}
