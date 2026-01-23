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
import { NaverTokenResponseDto } from './dto/naver-token-response.dto';
import { NaverUserInfoDto } from './dto/naver-user-info.dto';

/**
 * Naver OAuth API Client
 * HTTP 레이어: Naver API와의 통신만 담당
 */
@Injectable()
export class NaverOAuthClient implements OAuthProviderClient {
  private readonly logger = new Logger(NaverOAuthClient.name);
  private readonly tokenUrl = 'https://nid.naver.com/oauth2.0/token';
  private readonly userInfoUrl = 'https://openapi.naver.com/v1/nid/me';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authorization Code를 Access Token으로 교환
   */
  async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NAVER_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('NAVER_REDIRECT_URI');

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId!);
    params.append('client_secret', clientSecret!);
    params.append('redirect_uri', redirectUri!);
    params.append('code', code);

    try {
      this.logger.debug(`Requesting token with code: ${code.substring(0, 10)}...`);

      const response = await firstValueFrom(
        this.httpService.post<NaverTokenResponseDto>(this.tokenUrl, params, {
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
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string; error_description?: string }>;

      if (axiosError.response) {
        const errorData = axiosError.response.data;
        const statusCode = axiosError.response.status;

        this.logger.error(
          `Token exchange failed: ${statusCode} - ${errorData.error} - ${errorData.error_description}`,
        );

        // Naver OAuth 에러 코드에 따른 처리
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
        this.httpService.get<NaverUserInfoDto>(this.userInfoUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      this.logger.debug(`User info retrieved for user ID: ${response.data.response.id}`);

      const userData = response.data.response;

      return {
        id: userData.id,
        email: userData.email || null,
        name: userData.name || userData.nickname || null,
        profileImage: userData.profile_image || null,
        // 원본 데이터도 포함 (필요시 사용)
        raw: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ resultcode?: string; message?: string }>;

      if (axiosError.response) {
        const statusCode = axiosError.response.status;
        const errorData = axiosError.response.data;

        this.logger.error(
          `User info request failed: ${statusCode} - ${errorData.resultcode} - ${errorData.message}`,
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
