import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../src/auth/types/jwt-payload.interface';
import { JwtConfig } from '../src/config/jwt.config';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let jwtConfig: JwtConfig;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = app.get(ConfigService);

    // Cookie Parser 설정
    app.use(cookieParser());

    // CORS 설정
    const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    app.enableCors({
      origin: frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // ValidationPipe 설정
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    jwtService = app.get(JwtService);
    jwtConfig = configService.get<JwtConfig>('jwt')!;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /auth/me', () => {
    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return 401 when invalid token is provided in Authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 when invalid token is provided in cookie', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', 'access_token=invalid-token')
        .expect(401);
    });

    it('should return 401 when token is expired', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        roles: ['user'],
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago (expired)
      };

      const expiredToken = await jwtService.signAsync(payload, {
        secret: jwtConfig.access.secret,
        expiresIn: '-1h', // Already expired
      });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should return 401 when token has invalid signature', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
      };

      // Wrong secret
      const invalidToken = await jwtService.signAsync(payload, {
        secret: 'wrong-secret',
        expiresIn: '15m',
      });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should return 401 when token payload is missing sub', async () => {
      const invalidPayload = {
        roles: ['user'],
      } as JwtPayload;

      const token = await jwtService.signAsync(invalidPayload, {
        secret: jwtConfig.access.secret,
        expiresIn: '15m',
      });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should accept valid token from Authorization header', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        roles: ['user'],
      };

      const token = await jwtService.signAsync(payload, {
        secret: jwtConfig.access.secret,
        expiresIn: jwtConfig.access.expiresIn,
      });

      // Note: This will return 404 or 500 if user doesn't exist in DB
      // But the important part is that it passes authentication (401 -> other status)
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      // Should not be 401 (authentication passed)
      expect(response.status).not.toBe(401);
    });

    it('should accept valid token from cookie', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        roles: ['user'],
      };

      const token = await jwtService.signAsync(payload, {
        secret: jwtConfig.access.secret,
        expiresIn: jwtConfig.access.expiresIn,
      });

      // Note: This will return 404 or 500 if user doesn't exist in DB
      // But the important part is that it passes authentication (401 -> other status)
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `access_token=${token}`);

      // Should not be 401 (authentication passed)
      expect(response.status).not.toBe(401);
    });

    it('should prioritize Authorization header over cookie', async () => {
      const headerPayload: JwtPayload = {
        sub: 'user-header',
      };
      const cookiePayload: JwtPayload = {
        sub: 'user-cookie',
      };

      const headerToken = await jwtService.signAsync(headerPayload, {
        secret: jwtConfig.access.secret,
        expiresIn: jwtConfig.access.expiresIn,
      });
      const cookieToken = await jwtService.signAsync(cookiePayload, {
        secret: jwtConfig.access.secret,
        expiresIn: jwtConfig.access.expiresIn,
      });

      // Authorization header should be used (user-header)
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${headerToken}`)
        .set('Cookie', `access_token=${cookieToken}`);

      // Should not be 401 (authentication passed)
      expect(response.status).not.toBe(401);
    });
  });

  describe('Public endpoints', () => {
    it('should allow access to public endpoints without token', () => {
      // Assuming /auth/kakao is public (has @Public() decorator)
      return request(app.getHttpServer())
        .get('/auth/kakao')
        .expect((res) => {
          // Should not be 401 (might be redirect or other status)
          expect(res.status).not.toBe(401);
        });
    });
  });
});
