import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.interface';
import { JwtConfig } from '../../config/jwt.config';

/**
 * JWT 토큰 추출 함수
 * 1. Authorization 헤더 (Bearer token)
 * 2. 쿠키 (access_token)
 */
const extractJwtFromCookieOrHeader = (req: Request): string | null => {
  // 1. Authorization 헤더에서 추출
  const authHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (authHeader) {
    return authHeader;
  }

  // 2. 쿠키에서 추출
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }

  return null;
};

/**
 * JWT Strategy
 * Passport JWT 전략을 사용하여 토큰 검증 및 req.user 설정
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtConfig = configService.get<JwtConfig>('jwt')!;
    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: jwtConfig.access.secret,
    });
  }

  /**
   * JWT payload 검증 후 req.user에 설정될 값 반환
   */
  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      roles: payload.roles || [],
    };
  }
}
