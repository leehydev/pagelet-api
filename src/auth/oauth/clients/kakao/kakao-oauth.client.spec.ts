import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { KakaoOAuthClient } from './kakao-oauth.client';
import { KakaoTokenResponseDto } from './dto/kakao-token-response.dto';
import { KakaoUserInfoDto } from './dto/kakao-user-info.dto';

describe('KakaoOAuthClient', () => {
  let client: KakaoOAuthClient;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockConfig = {
    KAKAO_CLIENT_ID: 'test-client-id',
    KAKAO_CLIENT_SECRET: 'test-client-secret',
    KAKAO_REDIRECT_URI: 'http://localhost:3000/auth/kakao/callback',
  };

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => mockConfig[key as keyof typeof mockConfig]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KakaoOAuthClient,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    client = module.get<KakaoOAuthClient>(KakaoOAuthClient);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  describe('exchangeCodeForToken', () => {
    it('인증 코드를 액세스 토큰으로 교환해야 함', async () => {
      const mockTokenResponse: AxiosResponse<KakaoTokenResponseDto> = {
        data: {
          access_token: 'test-access-token',
          token_type: 'bearer',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          refresh_token_expires_in: 5184000,
          scope: 'profile_nickname profile_image',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(mockTokenResponse));

      const result = await client.exchangeCodeForToken('test-code');

      expect(result).toEqual({
        access_token: 'test-access-token',
        token_type: 'bearer',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        scope: 'profile_nickname profile_image',
      });

      expect(httpService.post).toHaveBeenCalledWith(
        'https://kauth.kakao.com/oauth/token',
        expect.any(URLSearchParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
    });

    it('코드가 유효하지 않을 때 INVALID_GRANT 에러를 던져야 함', async () => {
      const mockError: AxiosError = {
        response: {
          data: {
            error: 'invalid_grant',
            error_description: 'authorization code not found',
          },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      } as AxiosError;

      httpService.post.mockReturnValue(throwError(() => mockError));

      await expect(client.exchangeCodeForToken('invalid-code')).rejects.toThrow('INVALID_GRANT');
    });

    it('클라이언트 자격증명이 유효하지 않을 때 INVALID_CLIENT 에러를 던져야 함', async () => {
      const mockError: AxiosError = {
        response: {
          data: {
            error: 'invalid_client',
            error_description: 'client authentication failed',
          },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      } as AxiosError;

      httpService.post.mockReturnValue(throwError(() => mockError));

      await expect(client.exchangeCodeForToken('test-code')).rejects.toThrow('INVALID_CLIENT');
    });

    it('네트워크 오류 발생 시 TOKEN_EXCHANGE_FAILED 에러를 던져야 함', async () => {
      const mockError: AxiosError = {
        message: 'Network Error',
        isAxiosError: true,
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      httpService.post.mockReturnValue(throwError(() => mockError));

      await expect(client.exchangeCodeForToken('test-code')).rejects.toThrow(
        'TOKEN_EXCHANGE_FAILED',
      );
    });
  });

  describe('getUserInfo', () => {
    it('액세스 토큰으로 사용자 정보를 조회해야 함', async () => {
      const mockUserInfoResponse: AxiosResponse<KakaoUserInfoDto> = {
        data: {
          id: 123456789,
          connected_at: '2024-01-01T00:00:00Z',
          properties: {
            nickname: 'Test User',
            profile_image: 'https://example.com/profile.jpg',
            thumbnail_image: 'https://example.com/thumbnail.jpg',
          },
          kakao_account: {
            profile_nickname_needs_agreement: false,
            profile_image_needs_agreement: false,
            profile: {
              nickname: 'Test User',
              thumbnail_image_url: 'https://example.com/thumbnail.jpg',
              profile_image_url: 'https://example.com/profile.jpg',
              is_default_image: false,
            },
            has_email: true,
            email_needs_agreement: false,
            is_email_valid: true,
            is_email_verified: true,
            email: 'test@example.com',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(mockUserInfoResponse));

      const result = await client.getUserInfo('test-access-token');

      expect(result).toEqual({
        id: '123456789',
        email: 'test@example.com',
        name: 'Test User',
        profileImage: 'https://example.com/profile.jpg',
        raw: mockUserInfoResponse.data,
      });

      expect(httpService.get).toHaveBeenCalledWith('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: 'Bearer test-access-token',
        },
      });
    });

    it('최소한의 데이터로 사용자 정보를 처리해야 함', async () => {
      const mockUserInfoResponse: AxiosResponse<KakaoUserInfoDto> = {
        data: {
          id: 123456789,
          properties: {
            nickname: 'Test User',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(mockUserInfoResponse));

      const result = await client.getUserInfo('test-access-token');

      expect(result).toEqual({
        id: '123456789',
        email: null,
        name: 'Test User',
        profileImage: null,
        raw: mockUserInfoResponse.data,
      });
    });

    it('토큰이 만료되었을 때 TOKEN_EXPIRED 에러를 던져야 함', async () => {
      const mockError: AxiosError = {
        response: {
          data: {
            msg: 'this access token does not exist',
            code: -401,
          },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => mockError));

      await expect(client.getUserInfo('expired-token')).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('스코프가 부족할 때 INSUFFICIENT_SCOPE 에러를 던져야 함', async () => {
      const mockError: AxiosError = {
        response: {
          data: {
            msg: 'insufficient scope',
            code: -403,
          },
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed',
        toJSON: () => ({}),
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => mockError));

      await expect(client.getUserInfo('test-token')).rejects.toThrow('INSUFFICIENT_SCOPE');
    });

    it('네트워크 오류 발생 시 USER_INFO_FAILED 에러를 던져야 함', async () => {
      const mockError: AxiosError = {
        message: 'Network Error',
        isAxiosError: true,
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => mockError));

      await expect(client.getUserInfo('test-token')).rejects.toThrow('USER_INFO_FAILED');
    });
  });
});
