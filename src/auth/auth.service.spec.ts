import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { SocialAccount } from './entities/social-account.entity';
import { KakaoOAuthService } from './oauth/services/kakao-oauth.service';
import { NaverOAuthService } from './oauth/services/naver-oauth.service';
import { RedisService } from '../common/redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let redisMock: Record<string, jest.Mock>;

  const mockJwtConfig = {
    access: {
      secret: 'access-secret',
      expiresIn: '1h',
    },
    refresh: {
      secret: 'refresh-secret',
      expiresIn: '7d',
    },
  };

  const mockUserId = 'user-123';
  const mockRefreshToken = 'valid-refresh-token';
  const mockNewAccessToken = 'new-access-token';
  const mockCachedAccessToken = 'cached-access-token';

  // Redis 키 prefix (서비스 코드와 일치)
  const REFRESH_TOKEN_PREFIX = 'pagelet:auth:refresh:';
  const REFRESH_RESULT_PREFIX = 'pagelet:auth:refresh:result:';
  const REFRESH_LOCK_PREFIX = 'pagelet:auth:refresh:lock:';

  beforeEach(async () => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(SocialAccount),
          useValue: {},
        },
        {
          provide: KakaoOAuthService,
          useValue: {},
        },
        {
          provide: NaverOAuthService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockJwtConfig),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue(redisMock),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('refreshAccessToken', () => {
    describe('JWT 검증', () => {
      it('JWT 검증 실패 시 UnauthorizedException 발생', async () => {
        jest.spyOn(jwtService, 'verify').mockImplementation(() => {
          throw new Error('Invalid token');
        });

        await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
          '만료되었거나 유효하지 않은 토큰입니다.',
        );
      });
    });

    describe('캐시 히트', () => {
      it('캐시된 토큰이 있으면 즉시 반환', async () => {
        jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: mockUserId });
        redisMock.get.mockResolvedValueOnce(mockCachedAccessToken);

        const result = await service.refreshAccessToken(mockRefreshToken);

        expect(result).toEqual({
          accessToken: mockCachedAccessToken,
          isCached: true,
        });
        expect(redisMock.get).toHaveBeenCalledWith(`${REFRESH_RESULT_PREFIX}${mockUserId}`);
        expect(redisMock.set).not.toHaveBeenCalled();
      });
    });

    describe('락 획득 성공', () => {
      beforeEach(() => {
        jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: mockUserId });
        redisMock.get
          .mockResolvedValueOnce(null) // 캐시 미스
          .mockResolvedValueOnce(mockRefreshToken); // 저장된 토큰
        redisMock.set.mockResolvedValue('OK');
        redisMock.del.mockResolvedValue(1);
        jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockNewAccessToken);
      });

      it('새 토큰 발급 및 캐시 저장', async () => {
        const result = await service.refreshAccessToken(mockRefreshToken);

        expect(result).toEqual({
          accessToken: mockNewAccessToken,
          isCached: false,
        });

        // 락 획득 호출 확인
        expect(redisMock.set).toHaveBeenCalledWith(
          `${REFRESH_LOCK_PREFIX}${mockUserId}`,
          '1',
          'EX',
          5,
          'NX',
        );

        // 결과 캐시 저장 확인
        expect(redisMock.set).toHaveBeenCalledWith(
          `${REFRESH_RESULT_PREFIX}${mockUserId}`,
          mockNewAccessToken,
          'EX',
          10,
        );

        // 락 해제 확인
        expect(redisMock.del).toHaveBeenCalledWith(`${REFRESH_LOCK_PREFIX}${mockUserId}`);
      });

      it('저장된 토큰과 불일치 시 UnauthorizedException 발생 및 락 해제', async () => {
        redisMock.get
          .mockReset()
          .mockResolvedValueOnce(null) // 캐시 미스
          .mockResolvedValueOnce('different-token'); // 저장된 토큰 불일치

        await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
          '유효하지 않은 토큰입니다.',
        );

        // 락 해제 확인 (finally 블록)
        expect(redisMock.del).toHaveBeenCalledWith(`${REFRESH_LOCK_PREFIX}${mockUserId}`);
      });

      it('저장된 토큰이 없으면 UnauthorizedException 발생', async () => {
        redisMock.get
          .mockReset()
          .mockResolvedValueOnce(null) // 캐시 미스
          .mockResolvedValueOnce(null); // 저장된 토큰 없음

        await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
          '유효하지 않은 토큰입니다.',
        );
      });
    });

    describe('락 충돌', () => {
      beforeEach(() => {
        jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: mockUserId });
        redisMock.get.mockResolvedValueOnce(null); // 캐시 미스
        redisMock.set.mockResolvedValue(null); // 락 획득 실패
      });

      it('대기 후 캐시 히트 시 캐시된 토큰 반환', async () => {
        redisMock.get.mockResolvedValueOnce(mockCachedAccessToken); // 대기 후 캐시 히트

        const result = await service.refreshAccessToken(mockRefreshToken);

        expect(result).toEqual({
          accessToken: mockCachedAccessToken,
          isCached: true,
        });
      });

      it('대기 후에도 캐시 미스면 UnauthorizedException 발생', async () => {
        redisMock.get.mockResolvedValueOnce(null); // 대기 후에도 캐시 미스

        await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
          '토큰 갱신 실패',
        );
      });
    });

    describe('에러 발생 시 락 해제', () => {
      it('토큰 발급 중 에러 발생해도 락은 해제됨', async () => {
        jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: mockUserId });
        redisMock.get
          .mockResolvedValueOnce(null) // 캐시 미스
          .mockResolvedValueOnce(mockRefreshToken); // 저장된 토큰
        redisMock.set.mockResolvedValue('OK'); // 락 획득 성공
        redisMock.del.mockResolvedValue(1);
        jest.spyOn(jwtService, 'signAsync').mockRejectedValue(new Error('Sign error'));

        await expect(service.refreshAccessToken(mockRefreshToken)).rejects.toThrow('Sign error');

        // finally 블록에서 락 해제 확인
        expect(redisMock.del).toHaveBeenCalledWith(`${REFRESH_LOCK_PREFIX}${mockUserId}`);
      });
    });
  });
});
