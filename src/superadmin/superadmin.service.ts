import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User, AccountStatus } from '../auth/entities/user.entity';
import { Site } from '../site/entities/site.entity';
import { Post } from '../post/entities/post.entity';
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
import {
  DashboardStatsResponseDto,
  DailyStatsResponseDto,
  DailyStatDto,
  RecentSiteDto,
  RecentSitesResponseDto,
} from './dto/dashboard-stats-response.dto';
import { StorageUsageService } from '../storage/storage-usage.service';

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
    private readonly systemSettingService: SystemSettingService,
    private readonly siteService: SiteService,
    private readonly storageUsageService: StorageUsageService,
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
   * 대시보드 통계 조회
   */
  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalSites,
      totalPosts,
      pendingUsers,
      usersThisWeek,
      sitesThisWeek,
      postsThisWeek,
    ] = await Promise.all([
      this.userRepository.count(),
      this.siteRepository.count(),
      this.postRepository.count(),
      this.userRepository.count({ where: { accountStatus: AccountStatus.PENDING } }),
      this.userRepository.count({ where: { createdAt: MoreThanOrEqual(weekAgo) } }),
      this.siteRepository.count({ where: { createdAt: MoreThanOrEqual(weekAgo) } }),
      this.postRepository.count({ where: { createdAt: MoreThanOrEqual(weekAgo) } }),
    ]);

    return new DashboardStatsResponseDto({
      totalUsers,
      totalSites,
      totalPosts,
      pendingUsers,
      usersThisWeek,
      sitesThisWeek,
      postsThisWeek,
      storageUsedBytes: 0, // TODO: 전체 스토리지 합계 구현
      storageTotalBytes: 500 * 1024 * 1024 * 1024, // 500GB
    });
  }

  /**
   * 일별 통계 조회 (최근 7일)
   */
  async getDailyStats(): Promise<DailyStatsResponseDto> {
    const days = 7;
    const result: { users: DailyStatDto[]; posts: DailyStatDto[] } = {
      users: [],
      posts: [],
    };

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [userCount, postCount] = await Promise.all([
        this.userRepository
          .createQueryBuilder('user')
          .where('user.createdAt >= :start', { start: date })
          .andWhere('user.createdAt < :end', { end: nextDate })
          .getCount(),
        this.postRepository
          .createQueryBuilder('post')
          .where('post.createdAt >= :start', { start: date })
          .andWhere('post.createdAt < :end', { end: nextDate })
          .getCount(),
      ]);

      const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

      result.users.push(new DailyStatDto({ date: dayName, count: userCount }));
      result.posts.push(new DailyStatDto({ date: dayName, count: postCount }));
    }

    return new DailyStatsResponseDto(result);
  }

  /**
   * 최근 생성된 사이트 목록 조회
   */
  async getRecentSites(limit: number = 5): Promise<RecentSitesResponseDto> {
    const sites = await this.siteRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['id', 'slug', 'userId', 'createdAt'],
    });

    return new RecentSitesResponseDto({
      sites: sites.map(
        (site) =>
          new RecentSiteDto({
            id: site.id,
            slug: site.slug,
            userId: site.userId,
            createdAt: site.createdAt,
          }),
      ),
    });
  }
}
