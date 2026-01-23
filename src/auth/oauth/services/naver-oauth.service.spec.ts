import { Test, TestingModule } from '@nestjs/testing';
import { NaverOAuthService } from './naver-oauth.service';
import { NaverOAuthClient } from '../clients/naver/naver-oauth.client';
import { BusinessException } from '../../../common/exception/business.exception';
import { ErrorCode } from '../../../common/exception/error-code';

describe('NaverOAuthService', () => {
  let service: NaverOAuthService;
  let naverOAuthClient: jest.Mocked<NaverOAuthClient>;

  beforeEach(async () => {
    const mockNaverOAuthClient = {
      exchangeCodeForToken: jest.fn(),
      getUserInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NaverOAuthService,
        {
          provide: NaverOAuthClient,
          useValue: mockNaverOAuthClient,
        },
      ],
    }).compile();

    service = module.get<NaverOAuthService>(NaverOAuthService);
    naverOAuthClient = module.get(NaverOAuthClient);
  });

  describe('authenticate', () => {
    it('성공적으로 인증하고 사용자 정보를 반환해야 함', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 3600,
      };

      const mockUserInfo = {
        id: '32742776',
        email: 'test@example.com',
        name: 'Test User',
        profileImage: 'https://example.com/profile.jpg',
      };

      naverOAuthClient.exchangeCodeForToken.mockResolvedValue(mockTokenResponse);
      naverOAuthClient.getUserInfo.mockResolvedValue(mockUserInfo);

      const result = await service.authenticate('test-code');

      expect(result).toEqual(mockUserInfo);
      expect(naverOAuthClient.exchangeCodeForToken).toHaveBeenCalledWith('test-code');
      expect(naverOAuthClient.getUserInfo).toHaveBeenCalledWith('test-access-token');
    });

    it('코드가 유효하지 않을 때 OAUTH_INVALID_CODE로 BusinessException을 던져야 함', async () => {
      naverOAuthClient.exchangeCodeForToken.mockRejectedValue(new Error('INVALID_GRANT'));

      await expect(service.authenticate('invalid-code')).rejects.toThrow(BusinessException);

      try {
        await service.authenticate('invalid-code');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCode.OAUTH_INVALID_CODE);
      }
    });

    it('토큰이 만료되었을 때 OAUTH_TOKEN_EXPIRED로 BusinessException을 던져야 함', async () => {
      const mockTokenResponse = {
        access_token: 'expired-token',
        token_type: 'bearer',
        expires_in: 3600,
      };

      naverOAuthClient.exchangeCodeForToken.mockResolvedValue(mockTokenResponse);
      naverOAuthClient.getUserInfo.mockRejectedValue(new Error('TOKEN_EXPIRED'));

      await expect(service.authenticate('test-code')).rejects.toThrow(BusinessException);

      try {
        await service.authenticate('test-code');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCode.OAUTH_TOKEN_EXPIRED);
      }
    });

    it('스코프가 부족할 때 OAUTH_INSUFFICIENT_SCOPE로 BusinessException을 던져야 함', async () => {
      const mockTokenResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        expires_in: 3600,
      };

      naverOAuthClient.exchangeCodeForToken.mockResolvedValue(mockTokenResponse);
      naverOAuthClient.getUserInfo.mockRejectedValue(new Error('INSUFFICIENT_SCOPE'));

      await expect(service.authenticate('test-code')).rejects.toThrow(BusinessException);

      try {
        await service.authenticate('test-code');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCode.OAUTH_INSUFFICIENT_SCOPE);
      }
    });

    it('클라이언트가 유효하지 않을 때 OAUTH_PROVIDER_ERROR로 BusinessException을 던져야 함', async () => {
      naverOAuthClient.exchangeCodeForToken.mockRejectedValue(new Error('INVALID_CLIENT'));

      await expect(service.authenticate('test-code')).rejects.toThrow(BusinessException);

      try {
        await service.authenticate('test-code');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCode.OAUTH_PROVIDER_ERROR);
      }
    });

    it('토큰 교환 실패 시 OAUTH_USER_INFO_FAILED로 BusinessException을 던져야 함', async () => {
      naverOAuthClient.exchangeCodeForToken.mockRejectedValue(new Error('TOKEN_EXCHANGE_FAILED'));

      await expect(service.authenticate('test-code')).rejects.toThrow(BusinessException);

      try {
        await service.authenticate('test-code');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCode.OAUTH_USER_INFO_FAILED);
      }
    });

    it('사용자 정보 조회 실패 시 OAUTH_USER_INFO_FAILED로 BusinessException을 던져야 함', async () => {
      const mockTokenResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        expires_in: 3600,
      };

      naverOAuthClient.exchangeCodeForToken.mockResolvedValue(mockTokenResponse);
      naverOAuthClient.getUserInfo.mockRejectedValue(new Error('USER_INFO_FAILED'));

      await expect(service.authenticate('test-code')).rejects.toThrow(BusinessException);

      try {
        await service.authenticate('test-code');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCode.OAUTH_USER_INFO_FAILED);
      }
    });

    it('알 수 없는 오류 발생 시 OAUTH_PROVIDER_ERROR로 BusinessException을 던져야 함', async () => {
      naverOAuthClient.exchangeCodeForToken.mockRejectedValue(new Error('UNKNOWN_ERROR'));

      await expect(service.authenticate('test-code')).rejects.toThrow(BusinessException);

      try {
        await service.authenticate('test-code');
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCode.OAUTH_PROVIDER_ERROR);
      }
    });
  });
});
