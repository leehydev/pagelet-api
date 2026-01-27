import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AccountStatus } from '../auth/entities/user.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { WaitlistUserResponseDto } from './dto/waitlist-user-response.dto';
import { SystemSettingService } from '../config/system-setting.service';
import { SystemSettingResponseDto } from './dto/system-setting-response.dto';
import { RegistrationMode, SystemSettingKey } from '../config/constants/registration-mode';
import { SiteService } from '../site/site.service';
import { ReservedSlugResponseDto } from './dto/reserved-slug-response.dto';
import { CreateReservedSlugDto } from './dto/create-reserved-slug.dto';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly systemSettingService: SystemSettingService,
    private readonly siteService: SiteService,
  ) {}

  /**
   * 대기자 목록 조회 (PENDING 상태 사용자)
   */
  async getWaitlist(): Promise<WaitlistUserResponseDto[]> {
    const users = await this.userRepository.find({
      where: { accountStatus: AccountStatus.PENDING },
      order: { createdAt: 'ASC' },
      select: ['id', 'email', 'name', 'createdAt'],
    });

    return users.map(
      (user) =>
        new WaitlistUserResponseDto({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        }),
    );
  }

  /**
   * 대기자 승인 (PENDING -> ACTIVE)
   */
  async approveUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw BusinessException.fromErrorCode(ErrorCode.USER_NOT_FOUND);
    }

    if (user.accountStatus !== AccountStatus.PENDING) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'User is not in pending status',
      );
    }

    user.accountStatus = AccountStatus.ACTIVE;
    await this.userRepository.save(user);
    this.logger.log(`User ${userId} approved and activated`);
  }

  /**
   * 시스템 설정 조회
   * @param key 설정 키
   * @returns 설정 정보
   * @throws SETTING_NOT_FOUND 설정이 없는 경우
   */
  async getSetting(key: string): Promise<SystemSettingResponseDto> {
    const setting = await this.systemSettingService.getSettingEntity(key);

    if (!setting) {
      throw BusinessException.fromErrorCode(
        ErrorCode.SETTING_NOT_FOUND,
        `Setting not found: ${key}`,
      );
    }

    return new SystemSettingResponseDto({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      updatedAt: setting.updatedAt,
    });
  }

  /**
   * 시스템 설정 변경
   * @param key 설정 키
   * @param value 새로운 설정 값
   * @returns 변경된 설정 정보
   * @throws SETTING_NOT_FOUND 설정이 없는 경우
   * @throws SETTING_INVALID_VALUE 유효하지 않은 값인 경우
   */
  async updateSetting(key: string, value: string): Promise<SystemSettingResponseDto> {
    // 설정 존재 여부 확인
    const existingSetting = await this.systemSettingService.getSettingEntity(key);
    if (!existingSetting) {
      throw BusinessException.fromErrorCode(
        ErrorCode.SETTING_NOT_FOUND,
        `Setting not found: ${key}`,
      );
    }

    // registration_mode의 경우 PENDING/ACTIVE 값만 허용
    if (key === SystemSettingKey.REGISTRATION_MODE) {
      if (value !== RegistrationMode.PENDING && value !== RegistrationMode.ACTIVE) {
        throw BusinessException.fromErrorCode(
          ErrorCode.SETTING_INVALID_VALUE,
          `registration_mode must be '${RegistrationMode.PENDING}' or '${RegistrationMode.ACTIVE}'`,
        );
      }
    }

    // 설정 값 업데이트
    await this.systemSettingService.set(key, value);
    this.logger.log(`System setting updated: ${key}=${value}`);

    // 업데이트된 설정 조회하여 반환
    const updatedSetting = await this.systemSettingService.getSettingEntity(key);
    return new SystemSettingResponseDto({
      key: updatedSetting!.key,
      value: updatedSetting!.value,
      description: updatedSetting!.description,
      updatedAt: updatedSetting!.updatedAt,
    });
  }

  /**
   * 예약어 슬러그 목록 조회
   */
  async getReservedSlugs(): Promise<ReservedSlugResponseDto[]> {
    const slugs = await this.siteService.getReservedSlugs();
    return slugs.map(
      (slug) =>
        new ReservedSlugResponseDto({
          id: slug.id,
          slug: slug.slug,
          reason: slug.reason,
          adminOnly: slug.adminOnly,
          createdAt: slug.createdAt,
        }),
    );
  }

  /**
   * 예약어 슬러그 추가
   */
  async createReservedSlug(dto: CreateReservedSlugDto): Promise<ReservedSlugResponseDto> {
    // 중복 체크
    const exists = await this.siteService.isReservedSlugExists(dto.slug);
    if (exists) {
      throw BusinessException.fromErrorCode(ErrorCode.RESERVED_SLUG_ALREADY_EXISTS);
    }

    const slug = await this.siteService.createReservedSlug(
      dto.slug,
      dto.reason ?? null,
      dto.adminOnly ?? false,
    );

    this.logger.log(`Reserved slug created: ${slug.slug}`);

    return new ReservedSlugResponseDto({
      id: slug.id,
      slug: slug.slug,
      reason: slug.reason,
      adminOnly: slug.adminOnly,
      createdAt: slug.createdAt,
    });
  }

  /**
   * 예약어 슬러그 삭제
   */
  async deleteReservedSlug(slugId: string): Promise<void> {
    const slug = await this.siteService.findReservedSlugById(slugId);
    if (!slug) {
      throw BusinessException.fromErrorCode(ErrorCode.RESERVED_SLUG_NOT_FOUND);
    }

    await this.siteService.deleteReservedSlug(slugId);
    this.logger.log(`Reserved slug deleted: ${slug.slug}`);
  }

  /**
   * 사용자 어드민 권한 설정
   */
  async setUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw BusinessException.fromErrorCode(ErrorCode.USER_NOT_FOUND);
    }

    user.isAdmin = isAdmin;
    await this.userRepository.save(user);
    this.logger.log(`User ${userId} admin status set to ${isAdmin}`);
  }
}
