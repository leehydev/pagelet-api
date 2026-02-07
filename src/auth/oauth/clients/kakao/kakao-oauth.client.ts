import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  OAuthProviderClient,
  OAuthTokenResponse,
  OAuthUserInfo,
} from '../interfaces/oauth-provider-client.interface';
import { KakaoTokenResponseDto } from './dto/kakao-token-response.dto';
import { KakaoUserInfoDto } from './dto/kakao-user-info.dto';

/**
 * Kakao OAuth API Client
 * HTTP 레이어: Kakao API와의 통신만 담당
 */
@Injectable()
export class KakaoOAuthClient implements OAuthProviderClient {
  private readonly logger = new Logger(KakaoOAuthClient.name);
  private readonly tokenUrl = 'https://kauth.kakao.com/oauth/token';
  private readonly userInfoUrl = 'https://kapi.kakao.com/v2/user/me';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authorization Code를 Access Token으로 교환
   * @param code Authorization Code
   * @param customRedirectUri 프론트엔드에서 사용한 redirect URI (선택, 없으면 환경변수 사용)
   */
  async exchangeCodeForToken(
    code: string,
    customRedirectUri?: string,
  ): Promise<OAuthTokenResponse> {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
    const clientSecret = this.configService.get<string>('KAKAO_CLIENT_SECRET');
    const redirectUri = customRedirectUri || this.configService.get<string>('KAKAO_REDIRECT_URI');

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId!);
    params.append('client_secret', clientSecret!);
    params.append('redirect_uri', redirectUri!);
    params.append('code', code);

    try {
      this.logger.debug(`Requesting token with code: ${code.substring(0, 10)}...`);

      const response = await firstValueFrom(
        this.httpService.post<KakaoTokenResponseDto>(this.tokenUrl, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      this.logger.debug('Token exchange successful');

      return {
        access_token: response.data.access_token,
        token_type: response.data.token_type,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        scope: response.data.scope,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string; error_description?: string }>;

      if (axiosError.response) {
        const errorData = axiosError.response.data;
        const statusCode = axiosError.response.status;

        this.logger.error(
          `Token exchange failed: ${statusCode} - ${errorData.error} - ${errorData.error_description}`,
        );

        // Kakao OAuth 에러 코드에 따른 처리
        if (errorData.error === 'invalid_grant') {
          throw new Error('INVALID_GRANT');
        } else if (errorData.error === 'invalid_client') {
          throw new Error('INVALID_CLIENT');
        } else if (errorData.error === 'invalid_request') {
          throw new Error('INVALID_REQUEST');
        }
      }

      this.logger.error(`Token exchange failed: ${axiosError.message}`);
      throw new Error('TOKEN_EXCHANGE_FAILED');
    }
  }

  /**
   * Access Token을 사용하여 사용자 정보 조회
   */
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      this.logger.debug('Requesting user info...');

      const response = await firstValueFrom(
        this.httpService.get<KakaoUserInfoDto>(this.userInfoUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      this.logger.debug(`User info retrieved for user ID: ${response.data.id}`);

      const userData = response.data;
      const kakaoAccount = userData.kakao_account;

      return {
        id: userData.id.toString(),
        email: kakaoAccount?.email || null,
        name: kakaoAccount?.profile?.nickname || userData.properties?.nickname || null,
        profileImage:
          kakaoAccount?.profile?.profile_image_url || userData.properties?.profile_image || null,
        // 원본 데이터도 포함 (필요시 사용)
        raw: userData,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ msg?: string; code?: number }>;

      if (axiosError.response) {
        const statusCode = axiosError.response.status;
        const errorData = axiosError.response.data;

        this.logger.error(
          `User info request failed: ${statusCode} - ${errorData.msg || errorData.code}`,
        );

        if (statusCode === 401) {
          throw new Error('TOKEN_EXPIRED');
        } else if (statusCode === 403) {
          throw new Error('INSUFFICIENT_SCOPE');
        }
      }

      this.logger.error(`User info request failed: ${axiosError.message}`);
      throw new Error('USER_INFO_FAILED');
    }
  }
}
