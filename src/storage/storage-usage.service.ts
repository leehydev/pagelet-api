import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SiteStorageUsage } from './entities/storage-usage.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@Injectable()
export class StorageUsageService {
  private readonly logger = new Logger(StorageUsageService.name);

  constructor(
    @InjectRepository(SiteStorageUsage)
    private readonly storageUsageRepository: Repository<SiteStorageUsage>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 사이트의 StorageUsage 조회 또는 생성
   */
  async getOrCreate(siteId: string): Promise<SiteStorageUsage> {
    let usage = await this.storageUsageRepository.findOne({
      where: { site_id: siteId },
    });

    if (!usage) {
      usage = this.storageUsageRepository.create({
        site_id: siteId,
        used_bytes: 0,
        reserved_bytes: 0,
        max_bytes: 1073741824, // 1GB 기본값
      });
      usage = await this.storageUsageRepository.save(usage);
      this.logger.log(`Created storage usage for site: ${siteId}`);
    }

    return usage;
  }

  /**
   * 사용 가능한 용량 조회
   */
  async getAvailableBytes(siteId: string): Promise<number> {
    const usage = await this.getOrCreate(siteId);
    return usage.max_bytes - (usage.used_bytes + usage.reserved_bytes);
  }

  /**
   * 용량 예약 (트랜잭션 + row lock)
   */
  async reserveBytes(siteId: string, sizeBytes: number): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      let usage = await manager.findOne(SiteStorageUsage, {
        where: { site_id: siteId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!usage) {
        // 없으면 생성
        usage = manager.create(SiteStorageUsage, {
          site_id: siteId,
          used_bytes: 0,
          reserved_bytes: 0,
          max_bytes: 1073741824, // 1GB 기본값
        });
        usage = await manager.save(SiteStorageUsage, usage);
        this.logger.log(`Created storage usage for site: ${siteId} during reservation`);

        // 생성 후 다시 락을 걸어서 조회 (동시성 안전성 보장)
        usage = await manager.findOne(SiteStorageUsage, {
          where: { site_id: siteId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!usage) {
          throw new Error(`Failed to retrieve created storage usage for site: ${siteId}`);
        }
      }

      // 용량 체크
      const totalUsed = usage.used_bytes + usage.reserved_bytes;
      const available = usage.max_bytes - totalUsed;

      if (sizeBytes > available) {
        const usedMB = Math.round((usage.used_bytes / 1024 / 1024) * 10) / 10;
        const reservedMB = Math.round((usage.reserved_bytes / 1024 / 1024) * 10) / 10;
        const totalUsedMB = Math.round((totalUsed / 1024 / 1024) * 10) / 10;
        const maxMB = Math.round((usage.max_bytes / 1024 / 1024) * 10) / 10;
        const requestedMB = Math.round((sizeBytes / 1024 / 1024) * 10) / 10;
        const availableMB = Math.max(0, Math.round((available / 1024 / 1024) * 10) / 10);

        throw BusinessException.withMessage(
          ErrorCode.STORAGE_EXCEEDED,
          `저장 용량이 부족합니다. (사용 중: ${usedMB}MB, 예약 중: ${reservedMB}MB, 총 사용: ${totalUsedMB}MB / 최대: ${maxMB}MB, 요청: ${requestedMB}MB, 여유: ${availableMB}MB)`,
          {
            usedBytes: usage.used_bytes,
            reservedBytes: usage.reserved_bytes,
            totalUsedBytes: totalUsed,
            maxBytes: usage.max_bytes,
            availableBytes: Math.max(0, available),
            requestedBytes: sizeBytes,
          },
        );
      }

      // reserved_bytes 증가
      usage.reserved_bytes += sizeBytes;
      await manager.save(SiteStorageUsage, usage);

      this.logger.log(
        `Reserved ${sizeBytes} bytes for site ${siteId}. Reserved: ${usage.reserved_bytes}, Used: ${usage.used_bytes}`,
      );
    });
  }

  /**
   * 예약 → 사용으로 이동 (트랜잭션 + row lock)
   */
  async commitBytes(
    siteId: string,
    reservedSizeBytes: number,
    actualSizeBytes: number,
  ): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      let usage = await manager.findOne(SiteStorageUsage, {
        where: { site_id: siteId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!usage) {
        // 없으면 생성 (이론적으로는 reserveBytes에서 생성되어야 하지만, 방어적 코드)
        usage = manager.create(SiteStorageUsage, {
          site_id: siteId,
          used_bytes: 0,
          reserved_bytes: 0,
          max_bytes: 1073741824, // 1GB 기본값
        });
        usage = await manager.save(SiteStorageUsage, usage);
        this.logger.warn(`Created storage usage for site: ${siteId} during commit (unexpected)`);

        // 생성 후 다시 락을 걸어서 조회 (동시성 안전성 보장)
        usage = await manager.findOne(SiteStorageUsage, {
          where: { site_id: siteId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!usage) {
          throw new Error(`Failed to retrieve created storage usage for site: ${siteId}`);
        }
      }

      // reserved_bytes 감소, used_bytes 증가
      usage.reserved_bytes -= reservedSizeBytes;
      usage.used_bytes += actualSizeBytes;

      // 음수 방지
      if (usage.reserved_bytes < 0) {
        this.logger.warn(`Reserved bytes became negative for site ${siteId}. Setting to 0.`);
        usage.reserved_bytes = 0;
      }

      await manager.save(SiteStorageUsage, usage);

      this.logger.log(
        `Committed ${actualSizeBytes} bytes (reserved: ${reservedSizeBytes}) for site ${siteId}. Reserved: ${usage.reserved_bytes}, Used: ${usage.used_bytes}`,
      );
    });
  }

  /**
   * 예약 취소 (트랜잭션 + row lock)
   */
  async releaseBytes(siteId: string, sizeBytes: number): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const usage = await manager.findOne(SiteStorageUsage, {
        where: { site_id: siteId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!usage) {
        // 이미 삭제되었거나 존재하지 않음 (idempotent)
        this.logger.warn(`Storage usage not found for site ${siteId}, skipping release`);
        return;
      }

      // reserved_bytes 감소
      usage.reserved_bytes -= sizeBytes;

      // 음수 방지
      if (usage.reserved_bytes < 0) {
        this.logger.warn(`Reserved bytes became negative for site ${siteId}. Setting to 0.`);
        usage.reserved_bytes = 0;
      }

      await manager.save(SiteStorageUsage, usage);

      this.logger.log(
        `Released ${sizeBytes} bytes for site ${siteId}. Reserved: ${usage.reserved_bytes}, Used: ${usage.used_bytes}`,
      );
    });
  }
}
