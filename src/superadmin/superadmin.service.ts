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

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly systemSettingService: SystemSettingService,
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
}
