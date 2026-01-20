import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from '../types/jwt-payload.interface';
import { JwtConfig } from '../../config/jwt.config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockJwtConfig: JwtConfig = {
    access: {
      secret: 'test-access-secret',
      expiresIn: '15m',
    },
    refresh: {
      secret: 'test-refresh-secret',
      expiresIn: '7d',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'jwt') {
                return mockJwtConfig;
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user principal with userId and roles when payload is valid', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        roles: ['admin', 'user'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-123',
        roles: ['admin', 'user'],
      });
    });

    it('should return user principal with empty roles array when roles are not provided', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-123',
        roles: [],
      });
    });

    it('should throw UnauthorizedException when sub is missing', async () => {
      const payload: JwtPayload = {
        roles: ['admin'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as JwtPayload;

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('Invalid token payload');
    });

    it('should throw UnauthorizedException when sub is empty string', async () => {
      const payload: JwtPayload = {
        sub: '',
        roles: ['admin'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle payload with only sub field', async () => {
      const payload: JwtPayload = {
        sub: 'user-456',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-456',
        roles: [],
      });
    });
  });
});
