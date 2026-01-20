import { Injectable, Logger } from '@nestjs/common';
import { KakaoOAuthClient } from '../clients/kakao/kakao-oauth.client';
import { OAuthUserInfo } from '../clients/interfaces/oauth-provider-client.interface';
import { BusinessException } from '../../../common/exception/business.exception';
import { ErrorCode } from '../../../common/exception/error-code';

/**
 * Kakao OAuth Service
 * 비즈니스 로직 레이어: OAuth 인증 플로우 관리
 */
@Injectable()
export class KakaoOAuthService {
  private readonly logger = new Logger(KakaoOAuthService.name);

  constructor(private readonly kakaoOAuthClient: KakaoOAuthClient) {}

  /**
   * Authorization Code를 사용하여 사용자 정보 조회
   * @param code Authorization Code
   * @returns 사용자 정보
   */
  async authenticate(code: string): Promise<OAuthUserInfo> {
    try {
      this.logger.log(`Starting Kakao OAuth authentication with code: ${code.substring(0, 10)}...`);

      // 1. Authorization Code를 Access Token으로 교환
      const tokenResponse = await this.kakaoOAuthClient.exchangeCodeForToken(code);
      this.logger.debug('Token exchange successful');

      // 2. Access Token으로 사용자 정보 조회
      const userInfo = await this.kakaoOAuthClient.getUserInfo(tokenResponse.access_token);
      this.logger.log(`User info retrieved for user ID: ${userInfo.id}`);

      return userInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Kakao OAuth authentication failed: ${errorMessage}`);

      // Client에서 던진 에러를 BusinessException으로 변환
      switch (errorMessage) {
        case 'INVALID_GRANT':
          throw BusinessException.fromErrorCode(
            ErrorCode.OAUTH_INVALID_CODE,
            'Authorization code is invalid or expired',
          );
        case 'TOKEN_EXPIRED':
          throw BusinessException.fromErrorCode(
            ErrorCode.OAUTH_TOKEN_EXPIRED,
            'Access token has expired',
          );
        case 'INSUFFICIENT_SCOPE':
          throw BusinessException.fromErrorCode(
            ErrorCode.OAUTH_INSUFFICIENT_SCOPE,
            'Required OAuth scope is not granted',
          );
        case 'INVALID_CLIENT':
        case 'INVALID_REQUEST':
          throw BusinessException.fromErrorCode(
            ErrorCode.OAUTH_PROVIDER_ERROR,
            'Invalid OAuth request',
          );
        case 'TOKEN_EXCHANGE_FAILED':
        case 'USER_INFO_FAILED':
          throw BusinessException.fromErrorCode(
            ErrorCode.OAUTH_USER_INFO_FAILED,
            'Failed to authenticate with OAuth provider',
          );
        default:
          throw BusinessException.fromErrorCode(
            ErrorCode.OAUTH_PROVIDER_ERROR,
            `OAuth authentication failed: ${errorMessage}`,
          );
      }
    }
  }
}
