/**
 * OAuth Provider Client 인터페이스
 * 다양한 OAuth 프로바이더(Kakao, Google, Naver 등)를 확장 가능하도록 정의
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export interface OAuthUserInfo {
  id: string;
  email?: string | null;
  name?: string | null;
  profileImage?: string | null;
  [key: string]: any; // 프로바이더별 추가 필드 허용
}

/**
 * OAuth Provider Client 인터페이스
 */
export interface OAuthProviderClient {
  /**
   * Authorization Code를 Access Token으로 교환
   * @param code Authorization Code
   * @returns Access Token 및 관련 정보
   */
  exchangeCodeForToken(code: string): Promise<OAuthTokenResponse>;

  /**
   * Access Token을 사용하여 사용자 정보 조회
   * @param accessToken Access Token
   * @returns 사용자 정보
   */
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}
