import { Controller, Post, Body } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateSiteDto } from './dto/create-site.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

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
   * 사이트 생성 (Step 2)
   */
  @Post('site')
  async createSite(
    @CurrentUser() user: UserPrincipal,
    @Body() dto: CreateSiteDto,
  ): Promise<void> {
    await this.onboardingService.createSite(user.userId, dto);
  }

  /**
   * POST /onboarding/skip-first-post
   * 첫 글 작성 스킵 (Step 3)
   */
  @Post('skip-first-post')
  async skipFirstPost(@CurrentUser() user: UserPrincipal): Promise<void> {
    await this.onboardingService.skipFirstPost(user.userId);
  }

  /**
   * POST /onboarding/complete
   * 온보딩 완료 (첫 글 작성 후 호출)
   */
  @Post('complete')
  async completeOnboarding(@CurrentUser() user: UserPrincipal): Promise<void> {
    await this.onboardingService.completeOnboarding(user.userId);
  }
}
