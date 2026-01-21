import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, AccountStatus } from './entities/user.entity';
import { SocialAccount, OAuthProvider } from './entities/social-account.entity';
import { KakaoOAuthService } from './oauth/services/kakao-oauth.service';
import { OAuthUserInfo } from './oauth/clients/interfaces/oauth-provider-client.interface';
import { JwtPayload } from './types/jwt-payload.interface';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { JwtConfig } from '../config/jwt.config';

/**
 * Auth Service
 * 인증 및 사용자 관리 비즈니스 로직
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    private readonly kakaoOAuthService: KakaoOAuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Kakao OAuth 로그인 처리
   * @param code Authorization Code
   * @returns 로그인 응답 (JWT 토큰 포함)
   */
  async loginWithKakao(code: string): Promise<LoginResponseDto> {
    try {
      // 1. Kakao OAuth 인증 (code -> userInfo)
      const oauthUserInfo = await this.kakaoOAuthService.authenticate(code);
      this.logger.log(`Kakao OAuth authentication successful for user ID: ${oauthUserInfo.id}`);

      // 2. 사용자 조회 또는 생성
      const user = await this.findOrCreateUser(oauthUserInfo);

      // 3. SocialAccount upsert
      await this.upsertSocialAccount(user.id, oauthUserInfo.id);

      // 4. JWT 토큰 발급
      const tokens = await this.generateTokens(user.id);

      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        ...tokens,
      };
    } catch (error) {
      this.logger.error(
        `Kakao login failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 사용자 조회 또는 생성
   * 1. social_accounts 기준으로 조회 (provider + provider_user_id)
   * 2. 없으면 email로 조회 (선택)
   * 3. 없으면 신규 생성
   */
  private async findOrCreateUser(oauthUserInfo: OAuthUserInfo): Promise<User> {
    // 1. SocialAccount로 사용자 조회
    const socialAccount = await this.socialAccountRepository.findOne({
      where: {
        provider: OAuthProvider.KAKAO,
        providerUserId: oauthUserInfo.id,
      },
      relations: ['user'],
    });

    if (socialAccount) {
      this.logger.log(`Found existing user via social account: ${socialAccount.userId}`);
      return socialAccount.user;
    }

    // 2. Email로 사용자 조회 (email이 있는 경우)
    if (oauthUserInfo.email) {
      const userByEmail = await this.userRepository.findOne({
        where: { email: oauthUserInfo.email },
      });

      if (userByEmail) {
        this.logger.log(`Found existing user via email: ${userByEmail.id}`);
        return userByEmail;
      }
    }

    // 3. 신규 사용자 생성
    const email = oauthUserInfo.email || `KAKAO_${oauthUserInfo.id}@noemail.local`;
    const newUser = this.userRepository.create({
      email,
      name: oauthUserInfo.name,
      accountStatus: AccountStatus.ONBOARDING,
      onboardingStep: 1,
    });

    const savedUser = await this.userRepository.save(newUser);
    this.logger.log(`Created new user: ${savedUser.id}`);
    return savedUser;
  }

  /**
   * SocialAccount upsert
   */
  private async upsertSocialAccount(
    userId: string,
    providerUserId: string,
  ): Promise<SocialAccount> {
    const existing = await this.socialAccountRepository.findOne({
      where: {
        provider: OAuthProvider.KAKAO,
        providerUserId: providerUserId,
      },
    });

    if (existing) {
      // 업데이트
      existing.userId = userId;
      existing.isActive = true;
      existing.connectedAt = new Date();
      const updated = await this.socialAccountRepository.save(existing);
      this.logger.log(`Updated social account: ${updated.id}`);
      return updated;
    } else {
      // 생성
      const newSocialAccount = this.socialAccountRepository.create({
        userId: userId,
        provider: OAuthProvider.KAKAO,
        providerUserId: providerUserId,
        isActive: true,
        connectedAt: new Date(),
      });
      const saved = await this.socialAccountRepository.save(newSocialAccount);
      this.logger.log(`Created new social account: ${saved.id}`);
      return saved;
    }
  }

  /**
   * JWT 토큰 생성 (Access + Refresh)
   */
  private async generateTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jwtConfig = this.configService.get<JwtConfig>('jwt')!;
    const payload: JwtPayload = {
      sub: userId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.access.secret,
        expiresIn: jwtConfig.access.expiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.refresh.secret,
        expiresIn: jwtConfig.refresh.expiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * 사용자 정보 조회
   */
  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw BusinessException.fromErrorCode(ErrorCode.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      accountStatus: user.accountStatus,
      onboardingStep: user.onboardingStep,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
