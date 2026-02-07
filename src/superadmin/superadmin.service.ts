import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';

import { User, AccountStatus } from '../auth/entities/user.entity';
import { Site } from '../site/entities/site.entity';
import { Post, PostStatus } from '../post/entities/post.entity';
import { SiteStorageUsage } from '../storage/entities/storage-usage.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { WaitlistUserResponseDto } from './dto/waitlist-user-response.dto';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { SystemSettingService } from '../config/system-setting.service';
import { SystemSettingResponseDto } from './dto/system-setting-response.dto';
import { RegistrationMode, SystemSettingKey } from '../config/constants/registration-mode';
import { SiteService } from '../site/site.service';
import { ReservedSlugResponseDto } from './dto/reserved-slug-response.dto';
import { CreateReservedSlugDto } from './dto/create-reserved-slug.dto';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DailyStatsDto } from './dto/daily-stats.dto';
import { RecentSiteResponseDto } from './dto/recent-site-response.dto';
import { StorageSummaryResponseDto } from './dto/storage-summary-response.dto';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(SiteStorageUsage)
    private readonly storageUsageRepository: Repository<SiteStorageUsage>,
    private readonly systemSettingService: SystemSettingService,
    private readonly siteService: SiteService,
  ) {}

  /**
   * 대기자 목록 조회 (PENDING 상태 사용자)
   * @param limit 0이면 전체 조회, 그 외에는 limit 수만큼 조회
   */
  async getWaitlist(limit: number = 0): Promise<WaitlistUserResponseDto[]> {
    const users = await this.userRepository.find({
      where: { accountStatus: AccountStatus.PENDING },
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'name', 'createdAt'],
      ...(limit > 0 && { take: limit }),
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

  /**
   * 현재 슈퍼어드민 사용자 정보 조회
   */
  async getMe(userId: string): Promise<UserResponseDto> {
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

  /**
   * 대시보드 통합 데이터 조회
   */
  async getDashboard(): Promise<DashboardResponseDto> {
    const [summary, dailySignups, dailyPosts] = await Promise.all([
      this.getDashboardSummary(),
      this.getDailySignups(7),
      this.getDailyPosts(7),
    ]);

    return new DashboardResponseDto({
      summary,
      dailySignups,
      dailyPosts,
    });
  }

  /**
   * 대시보드 요약 통계 조회
   */
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const weekStart = this.getWeekStart();

    const [
      totalUsers,
      weeklyNewUsers,
      totalSites,
      weeklyNewSites,
      totalPosts,
      weeklyNewPosts,
      pendingUsers,
    ] = await Promise.all([
      this.userRepository.count({
        where: { accountStatus: AccountStatus.ACTIVE },
      }),
      this.userRepository.count({
        where: {
          accountStatus: AccountStatus.ACTIVE,
          createdAt: MoreThanOrEqual(weekStart),
        },
      }),
      this.siteRepository.count(),
      this.siteRepository.count({
        where: { createdAt: MoreThanOrEqual(weekStart) },
      }),
      this.postRepository.count({
        where: { status: PostStatus.PUBLISHED },
      }),
      this.postRepository.count({
        where: {
          status: PostStatus.PUBLISHED,
          publishedAt: MoreThanOrEqual(weekStart),
        },
      }),
      this.userRepository.count({
        where: { accountStatus: AccountStatus.PENDING },
      }),
    ]);

    return new DashboardSummaryDto({
      totalUsers,
      weeklyNewUsers,
      totalSites,
      weeklyNewSites,
      totalPosts,
      weeklyNewPosts,
      pendingUsers,
    });
  }

  /**
   * 일별 가입자 추이 조회
   */
  async getDailySignups(days: number): Promise<DailyStatsDto[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt >= :startDate', { startDate })
      .groupBy('DATE(user.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return this.fillMissingDates(result, days);
  }

  /**
   * 일별 포스트 발행 추이 조회
   */
  async getDailyPosts(days: number): Promise<DailyStatsDto[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const result = await this.postRepository
      .createQueryBuilder('post')
      .select('DATE(post.publishedAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('post.publishedAt >= :startDate', { startDate })
      .groupBy('DATE(post.publishedAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return this.fillMissingDates(result, days);
  }

  /**
   * 최근 생성된 사이트 목록 조회
   */
  async getRecentSites(limit: number): Promise<RecentSiteResponseDto[]> {
    const sites = await this.siteRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return sites.map(
      (site) =>
        new RecentSiteResponseDto({
          id: site.id,
          slug: site.slug,
          name: site.name,
          userId: site.userId,
          userName: site.user?.name ?? null,
          createdAt: site.createdAt,
        }),
    );
  }

  /**
   * 스토리지 요약 조회
   */
  async getStorageSummary(): Promise<StorageSummaryResponseDto> {
    const result = await this.storageUsageRepository
      .createQueryBuilder('storage')
      .select('COALESCE(SUM(storage.usedBytes), 0)', 'totalUsedBytes')
      .addSelect('COALESCE(SUM(storage.maxBytes), 0)', 'totalMaxBytes')
      .getRawOne();

    const totalUsedBytes = Number(result.totalUsedBytes) || 0;
    const totalMaxBytes = Number(result.totalMaxBytes) || 0;
    const usagePercentage =
      totalMaxBytes > 0 ? Math.round((totalUsedBytes / totalMaxBytes) * 100) : 0;

    return new StorageSummaryResponseDto({
      totalUsedBytes,
      totalMaxBytes,
      usagePercentage,
      totalUsedDisplay: this.formatBytes(totalUsedBytes),
      totalMaxDisplay: this.formatBytes(totalMaxBytes),
    });
  }

  /**
   * 이번주 시작일 (월요일 00:00:00) 계산
   */
  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일 기준
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * 빈 날짜 채우기 (데이터 없는 날은 count: 0)
   */
  private fillMissingDates(data: { date: string; count: string }[], days: number): DailyStatsDto[] {
    const result: DailyStatsDto[] = [];
    const dataMap = new Map(data.map((d) => [d.date, Number(d.count)]));

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      result.push(
        new DailyStatsDto({
          date: dateStr,
          count: dataMap.get(dateStr) ?? 0,
        }),
      );
    }

    return result;
  }

  /**
   * 바이트를 읽기 쉬운 형식으로 변환
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${Math.round(value * 10) / 10}${units[i]}`;
  }
}
