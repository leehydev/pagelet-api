import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AccountStatus, OnboardingStep } from '../auth/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateSiteDto } from './dto/create-site.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { SiteService } from '../site/site.service';
import { SystemSettingService } from '../config/system-setting.service';
import { RegistrationMode, SystemSettingKey } from '../config/constants/registration-mode';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly siteService: SiteService,
    private readonly systemSettingService: SystemSettingService,
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
    if (user.accountStatus !== AccountStatus.ONBOARDING) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_NOT_ALLOWED);
    }

    // 현재 단계가 1이 아니면 에러
    if (user.onboardingStep !== OnboardingStep.PROFILE) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_INVALID_STEP);
    }

    user.name = dto.name;
    user.email = dto.email;
    user.onboardingStep = OnboardingStep.SITE;

    await this.userRepository.save(user);
    this.logger.log(`User ${userId} completed profile step`);
  }

  /**
   * 사이트 생성 (Step 2) - 완료 시 온보딩 종료
   */
  async createSite(userId: string, dto: CreateSiteDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw BusinessException.fromErrorCode(ErrorCode.USER_NOT_FOUND);
    }

    // 온보딩 상태가 아니면 에러
    if (user.accountStatus !== AccountStatus.ONBOARDING) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_NOT_ALLOWED);
    }

    // 현재 단계가 2가 아니면 에러
    if (user.onboardingStep !== OnboardingStep.SITE) {
      throw BusinessException.fromErrorCode(ErrorCode.ONBOARDING_INVALID_STEP);
    }

    // slug 사용 가능 여부 확인
    const isAvailable = await this.siteService.isSlugAvailable(dto.slug);
    if (!isAvailable) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_SLUG_NOT_AVAILABLE);
    }

    // 사이트 생성
    await this.siteService.createSite(userId, dto.name, dto.slug);

    // 회원가입 모드에 따라 계정 상태 결정
    const registrationMode = await this.systemSettingService.getOrDefault(
      SystemSettingKey.REGISTRATION_MODE,
      RegistrationMode.PENDING,
    );

    user.accountStatus =
      registrationMode === RegistrationMode.ACTIVE ? AccountStatus.ACTIVE : AccountStatus.PENDING;
    user.onboardingStep = null;
    await this.userRepository.save(user);

    if (user.accountStatus === AccountStatus.PENDING) {
      this.logger.log(`User ${userId} completed onboarding, awaiting approval`);
    } else {
      this.logger.log(`User ${userId} completed onboarding, account activated`);
    }
  }
}
