import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateSiteDto } from './dto/create-site.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * GET /onboarding/check-slug
   * slug 사용 가능 여부 확인 (인증된 사용자용, isAdmin 고려)
   */
  @Get('check-slug')
  async checkSlug(
    @CurrentUser() user: UserPrincipal,
    @Query('slug') slug: string,
  ): Promise<{ available: boolean; message?: string }> {
    if (!slug) {
      return { available: false, message: 'slug is required' };
    }

    return this.onboardingService.checkSlug(user.userId, slug);
  }

  /**
   * POST /onboarding/profile
   * 프로필 입력 (Step 1)
   */
  @Post('profile')
  async updateProfile(
    @CurrentUser() user: UserPrincipal,
    @Body() dto: UpdateProfileDto,
  ): Promise<void> {
    await this.onboardingService.updateProfile(user.userId, dto);
  }

  /**
   * POST /onboarding/site
   * 사이트 생성 (Step 2) - 완료 시 온보딩 종료
   */
  @Post('site')
  async createSite(@CurrentUser() user: UserPrincipal, @Body() dto: CreateSiteDto): Promise<void> {
    await this.onboardingService.createSite(user.userId, dto);
  }
}
