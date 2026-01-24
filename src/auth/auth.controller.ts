import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { CookieUtil } from './utils/cookie.util';
import { Public } from './decorators/public.decorator';
import { AllowPending } from './decorators/allow-pending.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { UserPrincipal } from './types/jwt-payload.interface';
import type { UserResponseDto } from './dto/user-response.dto';
import { OAuthCodeDto } from './dto/oauth-code.dto';
import { LoginResponseDto } from './dto/login-response.dto';

/**
 * Auth Controller
 * OAuth 인증 및 사용자 관리 엔드포인트
 *
 * OAuth 흐름 (프론트엔드 주도):
 * 1. 프론트엔드가 OAuth 프로바이더로 직접 리다이렉트
 * 2. 프로바이더 콜백을 프론트엔드가 받음
 * 3. 프론트엔드가 POST /auth/{provider}/token으로 code 전달
 * 4. 백엔드가 code 교환 후 JWT 반환
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /auth/kakao/token
   * Kakao OAuth code를 JWT 토큰으로 교환
   *
   * 프론트엔드가 Kakao OAuth 콜백으로 받은 code를 전달하면
   * 백엔드가 code → access_token → user_info 교환 후 JWT 발급
   */
  @Public()
  @Post('kakao/token')
  async exchangeKakaoCode(@Body() dto: OAuthCodeDto): Promise<LoginResponseDto> {
    return this.authService.loginWithKakao(dto.code);
  }

  /**
   * POST /auth/naver/token
   * Naver OAuth code를 JWT 토큰으로 교환
   *
   * 프론트엔드가 Naver OAuth 콜백으로 받은 code를 전달하면
   * 백엔드가 code → access_token → user_info 교환 후 JWT 발급
   */
  @Public()
  @Post('naver/token')
  async exchangeNaverCode(@Body() dto: OAuthCodeDto): Promise<LoginResponseDto> {
    return this.authService.loginWithNaver(dto.code);
  }

  /**
   * GET /auth/me
   * 현재 로그인한 사용자 정보 조회
   * PENDING 상태의 사용자도 자신의 정보를 확인할 수 있어야 함
   */
  @AllowPending()
  @Get('me')
  async getCurrentUser(@CurrentUser() user: UserPrincipal): Promise<UserResponseDto> {
    return this.authService.getUserById(user.userId);
  }

  /**
   * POST /auth/refresh
   * 토큰 리프레시 - Authorization 헤더 또는 쿠키로 새 access_token 발급
   */
  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Authorization 헤더 우선, 쿠키 fallback (하위 호환)
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    // Authorization 헤더로 요청한 경우: JSON으로 accessToken 반환 (크로스 도메인용)
    if (authHeader) {
      res.status(HttpStatus.OK).json({
        accessToken: result.accessToken,
        isCached: result.isCached,
      });
      return;
    }

    // 쿠키로 요청한 경우: 기존 방식 유지 (하위 호환)
    CookieUtil.setAccessTokenCookie(res, result.accessToken, this.configService);
    res.status(HttpStatus.OK).json({
      success: true,
      isCached: result.isCached,
    });
  }

  /**
   * POST /auth/logout
   * 로그아웃 - Redis 토큰 삭제 + 쿠키 삭제
   */
  @Post('logout')
  async logout(@CurrentUser() user: UserPrincipal, @Res() res: Response): Promise<void> {
    // Redis에서 refresh token 삭제
    await this.authService.removeRefreshToken(user.userId);

    // 쿠키 삭제
    CookieUtil.clearCookies(res, this.configService, 'access_token', 'refresh_token');
    res.status(HttpStatus.OK).json({ message: 'Logged out successfully' });
  }
}
