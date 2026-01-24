import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@Injectable()
export class SystemSettingService {
  private readonly logger = new Logger(SystemSettingService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
  ) {}

  /**
   * 시스템 설정 값 조회
   * @param key 설정 키
   * @returns 설정 값 (없으면 null)
   */
  async get(key: string): Promise<string | null> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });
    return setting?.value ?? null;
  }

  /**
   * 시스템 설정 값 조회 (없으면 기본값 반환)
   * @param key 설정 키
   * @param defaultValue 기본값
   * @returns 설정 값 또는 기본값
   */
  async getOrDefault(key: string, defaultValue: string): Promise<string> {
    const value = await this.get(key);
    return value ?? defaultValue;
  }

  /**
   * 시스템 설정 값 조회 (없으면 에러)
   * @param key 설정 키
   * @returns 설정 값
   * @throws SETTING_NOT_FOUND 설정이 없는 경우
   */
  async getOrThrow(key: string): Promise<string> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw BusinessException.fromErrorCode(
        ErrorCode.SETTING_NOT_FOUND,
        `Setting not found: ${key}`,
      );
    }

    return setting.value;
  }

  /**
   * 시스템 설정 값 저장/업데이트
   * @param key 설정 키
   * @param value 설정 값
   * @param description 설정 설명 (선택)
   */
  async set(key: string, value: string, description?: string): Promise<void> {
    let setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (setting) {
      setting.value = value;
      if (description !== undefined) {
        setting.description = description;
      }
    } else {
      setting = this.systemSettingRepository.create({
        key,
        value,
        description: description ?? null,
      });
    }

    await this.systemSettingRepository.save(setting);
    this.logger.log(`System setting updated: ${key}=${value}`);
  }

  /**
   * 시스템 설정 전체 정보 조회
   * @param key 설정 키
   * @returns SystemSetting 엔티티 또는 null
   */
  async getSettingEntity(key: string): Promise<SystemSetting | null> {
    return this.systemSettingRepository.findOne({
      where: { key },
    });
  }
}
