import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { JwtConfig } from '../../config/jwt.config';
import type { StringValue } from 'ms';

/**
 * 쿠키 옵션 인터페이스
 */
export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  maxAge?: number;
  path?: string;
}

/**
 * 쿠키 유틸리티
 */
export class CookieUtil {
  /**
   * 환경 변수에서 쿠키 옵션 가져오기
   */
  static getCookieOptions(configService: ConfigService): CookieOptions {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = configService.get<string>('COOKIE_DOMAIN');
    const cookieSecure = configService.get<string>('COOKIE_SECURE', 'false') === 'true';
    const cookieSameSite = (configService.get<string>('COOKIE_SAME_SITE', 'lax') || 'lax') as
      | 'strict'
      | 'lax'
      | 'none';

    return {
      httpOnly: true,
      secure: cookieSecure || isProduction,
      sameSite: cookieSameSite,
      domain: cookieDomain || undefined,
      path: '/',
    };
  }

  /**
   * Access Token 쿠키 설정
   */
  static setAccessTokenCookie(
    res: Response,
    token: string,
    configService: ConfigService,
    maxAge?: number,
  ): void {
    const options = this.getCookieOptions(configService);
    const jwtConfig = configService.get<JwtConfig>('jwt');
    const accessTokenMaxAge =
      maxAge || (jwtConfig ? this.parseMsToSeconds(jwtConfig.access.expiresIn) : 900); // 기본 15분

    const cookieOptions = {
      ...options,
      maxAge: accessTokenMaxAge * 1000, // milliseconds
    };

    // 디버깅: 쿠키 옵션 로깅 (개발 환경에서만)
    if (configService.get<string>('NODE_ENV') !== 'production') {
      console.log('[CookieUtil] Setting access_token cookie:', {
        maxAge: cookieOptions.maxAge,
        domain: cookieOptions.domain,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: cookieOptions.path,
      });
    }

    res.cookie('access_token', token, cookieOptions);
  }

  /**
   * Refresh Token 쿠키 설정
   */
  static setRefreshTokenCookie(
    res: Response,
    token: string,
    configService: ConfigService,
    maxAge?: number,
  ): void {
    const options = this.getCookieOptions(configService);
    const jwtConfig = configService.get<JwtConfig>('jwt');
    const refreshTokenMaxAge =
      maxAge || (jwtConfig ? this.parseMsToSeconds(jwtConfig.refresh.expiresIn) : 604800); // 기본 7일

    const cookieOptions = {
      ...options,
      maxAge: refreshTokenMaxAge * 1000, // milliseconds
    };

    res.cookie('refresh_token', token, cookieOptions);
  }

  /**
   * 쿠키 삭제
   */
  static clearCookies(res: Response, configService: ConfigService, ...cookieNames: string[]): void {
    const options = this.getCookieOptions(configService);
    cookieNames.forEach((name) => {
      res.clearCookie(name, {
        ...options,
        maxAge: 0,
      });
    });
  }

  /**
   * 시간 문자열을 초 단위로 변환
   * ms 라이브러리를 사용하여 "15m", "1h", "7d" 등을 밀리초로 변환 후 초로 변환
   * 예: "15m" -> 900000 (ms) -> 900 (초)
   */
  private static parseMsToSeconds(timeString: string): number {
    try {
      // ms 라이브러리를 사용하여 밀리초로 변환
      const milliseconds = ms(timeString as StringValue);
      if (typeof milliseconds !== 'number' || Number.isNaN(milliseconds) || milliseconds <= 0) {
        console.warn(`Invalid time string: ${timeString}, using default 15 minutes`);
        return 900; // 기본 15분
      }
      // 밀리초를 초로 변환
      return Math.floor(milliseconds / 1000);
    } catch (error) {
      console.warn(`Failed to parse time string: ${timeString}, using default 15 minutes`, error);
      return 900; // 기본 15분
    }
  }
}
