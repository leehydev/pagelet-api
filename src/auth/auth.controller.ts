import {
  Controller,
  Get,
  Post,
  Res,
  Req,
  Query,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OAuthStateUtil } from './utils/oauth-state.util';
import { CookieUtil } from './utils/cookie.util';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { UserPrincipal } from './types/jwt-payload.interface';
import type { UserResponseDto } from './dto/user-response.dto';

/**
 * Auth Controller
 * OAuth 인증 및 사용자 관리 엔드포인트
 */
@Controller('auth')
export class AuthController {
  private readonly kakaoAuthUrl = 'https://kauth.kakao.com/oauth/authorize';

  constructor(
    private readonly authService: AuthService,
    private readonly oauthStateUtil: OAuthStateUtil,
    private readonly configService: ConfigService,
  ) {}

  /**
   * GET /auth/kakao
   * Kakao OAuth 시작 - Kakao authorize URL로 redirect
   */
  @Public()
  @Get('kakao')
  async startKakaoOAuth(@Res() res: Response): Promise<void> {
    try {
      // State 생성 (CSRF 방지, 선택적)
      // 카카오는 state 없이도 동작하지만 보안을 위해 사용 권장
      // const state = await this.oauthStateUtil.generateState();

      // Kakao OAuth URL 생성
      const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
      const redirectUri = this.configService.get<string>('KAKAO_REDIRECT_URI');

      const params = new URLSearchParams({
        client_id: clientId!,
        redirect_uri: redirectUri!,
        response_type: 'code',
      });

      const authUrl = `${this.kakaoAuthUrl}?${params.toString()}`;

      // Kakao로 redirect
      res.redirect(authUrl);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
      res.redirect(`${frontendUrl}/auth/error?message=oauth_init_failed`);
    }
  }

  /**
   * GET /auth/kakao/callback
   * Kakao OAuth 콜백 - code를 받아 로그인 처리 후 프론트엔드로 redirect
   */
  @Public()
  @Get('kakao/callback')
  async kakaoOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');

    try {
      // 에러 처리
      if (error) {
        res.redirect(
          `${frontendUrl}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`,
        );
        return;
      }

      // State 검증 (state가 있으면 검증, 없으면 통과)
      // 카카오는 state 없이도 인증 가능하지만, 보안을 위해 state 사용 권장
      if (state && !(await this.oauthStateUtil.validateState(state))) {
        res.redirect(`${frontendUrl}/auth/error?error=invalid_state`);
        return;
      }

      // Code 검증
      if (!code) {
        res.redirect(`${frontendUrl}/auth/error?error=missing_code`);
        return;
      }

      // 로그인 처리
      const loginResult = await this.authService.loginWithKakao(code);

      // HttpOnly 쿠키에 토큰 설정
      CookieUtil.setAccessTokenCookie(res, loginResult.accessToken, this.configService);
      CookieUtil.setRefreshTokenCookie(res, loginResult.refreshToken, this.configService);

      // 프론트엔드로 redirect (성공)
      res.redirect(`${frontendUrl}/auth/success`);
    } catch (error) {
      // 에러 발생 시 프론트엔드로 redirect
      const errorMessage = error instanceof Error ? error.message : 'unknown_error';
      res.redirect(`${frontendUrl}/auth/error?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  /**
   * GET /auth/me
   * 현재 로그인한 사용자 정보 조회
   */
  @Get('me')
  async getCurrentUser(@CurrentUser() user: UserPrincipal): Promise<UserResponseDto> {
    return this.authService.getUserById(user.userId);
  }

  /**
   * POST /auth/refresh
   * 토큰 리프레시 - refresh_token 쿠키로 새 access_token 발급
   */
  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    // 새 access_token을 쿠키에 설정
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
  async logout(
    @CurrentUser() user: UserPrincipal,
    @Res() res: Response,
  ): Promise<void> {
    // Redis에서 refresh token 삭제
    await this.authService.removeRefreshToken(user.userId);

    // 쿠키 삭제
    CookieUtil.clearCookies(res, this.configService, 'access_token', 'refresh_token');
    res.status(HttpStatus.OK).json({ message: 'Logged out successfully' });
  }
}
