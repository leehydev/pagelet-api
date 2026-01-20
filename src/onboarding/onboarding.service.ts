import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AccountStatus, OnboardingStep } from '../auth/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateSiteDto } from './dto/create-site.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { SiteService } from '../site/site.service';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly siteService: SiteService,
  ) {}

  /**
   * 프로필 업데이트 (Step 1)
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw BusinessException.fromErrorCode(ErrorCode.USER_NOT_FOUND);
    }

    // 온보딩 상태가 아니면 에러
    if (user.account_status !== AccountStatus.ONBOARDING) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_NOT_ALLOWED);
    }

    // 현재 단계가 1이 아니면 에러
    if (user.onboarding_step !== OnboardingStep.PROFILE) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_INVALID_STEP);
    }

    user.name = dto.name;
    user.email = dto.email;
    user.onboarding_step = OnboardingStep.SITE;

    await this.userRepository.save(user);
    this.logger.log(`User ${userId} completed profile step`);
  }

  /**
   * 사이트 생성 (Step 2)
   */
  async createSite(userId: string, dto: CreateSiteDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw BusinessException.fromErrorCode(ErrorCode.USER_NOT_FOUND);
    }

    // 온보딩 상태가 아니면 에러
    if (user.account_status !== AccountStatus.ONBOARDING) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_NOT_ALLOWED);
    }

    // 현재 단계가 2가 아니면 에러
    if (user.onboarding_step !== OnboardingStep.SITE) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_INVALID_STEP);
    }

    // slug 사용 가능 여부 확인
    const isAvailable = await this.siteService.isSlugAvailable(dto.slug);
    if (!isAvailable) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_SLUG_NOT_AVAILABLE);
    }

    // 사이트 생성
    await this.siteService.createSite(userId, dto.name, dto.slug);

    // 다음 단계로 이동
    user.onboarding_step = OnboardingStep.FIRST_POST;
    await this.userRepository.save(user);
    this.logger.log(`User ${userId} completed site step`);
  }

  /**
   * 온보딩 완료 (첫 글 작성 또는 스킵)
   */
  async completeOnboarding(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw BusinessException.fromErrorCode(ErrorCode.USER_NOT_FOUND);
    }

    // 온보딩 상태가 아니면 에러
    if (user.account_status !== AccountStatus.ONBOARDING) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_NOT_ALLOWED);
    }

    // 현재 단계가 3이 아니면 에러
    if (user.onboarding_step !== OnboardingStep.FIRST_POST) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_INVALID_STEP);
    }

    // 온보딩 완료
    user.account_status = AccountStatus.ACTIVE;
    user.onboarding_step = null;
    await this.userRepository.save(user);
    this.logger.log(`User ${userId} completed onboarding`);
  }

  /**
   * 첫 글 스킵 (Step 3 스킵)
   */
  async skipFirstPost(userId: string): Promise<void> {
    await this.completeOnboarding(userId);
    this.logger.log(`User ${userId} skipped first post`);
  }
}
