import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Big from 'big.js';
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
      where: { siteId: siteId },
    });

    if (!usage) {
      usage = this.storageUsageRepository.create({
        siteId: siteId,
        usedBytes: 0,
        reservedBytes: 0,
        maxBytes: 1073741824, // 1GB 기본값
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
    const max = new Big(usage.maxBytes);
    const used = new Big(usage.usedBytes);
    const reserved = new Big(usage.reservedBytes);
    return max.minus(used).minus(reserved).toNumber();
  }

  /**
   * 용량 예약 (트랜잭션 + row lock)
   */
  async reserveBytes(siteId: string, sizeBytes: number): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      let usage = await manager.findOne(SiteStorageUsage, {
        where: { siteId: siteId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!usage) {
        // 없으면 생성
        usage = manager.create(SiteStorageUsage, {
          siteId: siteId,
          usedBytes: 0,
          reservedBytes: 0,
          maxBytes: 1073741824, // 1GB 기본값
        });
        usage = await manager.save(SiteStorageUsage, usage);
        this.logger.log(`Created storage usage for site: ${siteId} during reservation`);

        // 생성 후 다시 락을 걸어서 조회 (동시성 안전성 보장)
        usage = await manager.findOne(SiteStorageUsage, {
          where: { siteId: siteId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!usage) {
          throw new Error(`Failed to retrieve created storage usage for site: ${siteId}`);
        }
      }

      // 용량 체크 (Big.js로 정확한 계산)
      const used = new Big(usage.usedBytes);
      const reserved = new Big(usage.reservedBytes);
      const max = new Big(usage.maxBytes);
      const requested = new Big(sizeBytes);

      const totalUsed = used.plus(reserved);
      const available = max.minus(totalUsed);

      if (requested.gt(available)) {
        const usedMB = Math.round((usage.usedBytes / 1024 / 1024) * 10) / 10;
        const reservedMB = Math.round((usage.reservedBytes / 1024 / 1024) * 10) / 10;
        const totalUsedMB = Math.round((totalUsed.toNumber() / 1024 / 1024) * 10) / 10;
        const maxMB = Math.round((usage.maxBytes / 1024 / 1024) * 10) / 10;
        const requestedMB = Math.round((sizeBytes / 1024 / 1024) * 10) / 10;
        const availableMB = Math.max(0, Math.round((available.toNumber() / 1024 / 1024) * 10) / 10);

        throw BusinessException.withMessage(
          ErrorCode.STORAGE_EXCEEDED,
          `저장 용량이 부족합니다. (사용 중: ${usedMB}MB, 예약 중: ${reservedMB}MB, 총 사용: ${totalUsedMB}MB / 최대: ${maxMB}MB, 요청: ${requestedMB}MB, 여유: ${availableMB}MB)`,
          {
            usedBytes: usage.usedBytes,
            reservedBytes: usage.reservedBytes,
            totalUsedBytes: totalUsed.toNumber(),
            maxBytes: usage.maxBytes,
            availableBytes: Math.max(0, available.toNumber()),
            requestedBytes: sizeBytes,
          },
        );
      }

      // reservedBytes 증가 (Big.js로 정확한 계산)
      const newReserved = reserved.plus(requested);
      usage.reservedBytes = newReserved.toNumber();
      await manager.save(SiteStorageUsage, usage);

      this.logger.log(
        `Reserved ${sizeBytes} bytes for site ${siteId}. Reserved: ${usage.reservedBytes}, Used: ${usage.usedBytes}`,
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
        where: { siteId: siteId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!usage) {
        // 없으면 생성 (이론적으로는 reserveBytes에서 생성되어야 하지만, 방어적 코드)
        usage = manager.create(SiteStorageUsage, {
          siteId: siteId,
          usedBytes: 0,
          reservedBytes: 0,
          maxBytes: 1073741824, // 1GB 기본값
        });
        usage = await manager.save(SiteStorageUsage, usage);
        this.logger.warn(`Created storage usage for site: ${siteId} during commit (unexpected)`);

        // 생성 후 다시 락을 걸어서 조회 (동시성 안전성 보장)
        usage = await manager.findOne(SiteStorageUsage, {
          where: { siteId: siteId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!usage) {
          throw new Error(`Failed to retrieve created storage usage for site: ${siteId}`);
        }
      }

      // reservedBytes 감소, usedBytes 증가 (Big.js로 정확한 계산)
      const reserved = new Big(usage.reservedBytes);
      const used = new Big(usage.usedBytes);
      const reservedToRelease = new Big(reservedSizeBytes);
      const actualSize = new Big(actualSizeBytes);

      const newReserved = reserved.minus(reservedToRelease);
      const newUsed = used.plus(actualSize);

      // 음수 방지
      if (newReserved.lt(0)) {
        this.logger.warn(`Reserved bytes became negative for site ${siteId}. Setting to 0.`);
        usage.reservedBytes = 0;
      } else {
        usage.reservedBytes = newReserved.toNumber();
      }

      usage.usedBytes = newUsed.toNumber();

      await manager.save(SiteStorageUsage, usage);

      this.logger.log(
        `Committed ${actualSizeBytes} bytes (reserved: ${reservedSizeBytes}) for site ${siteId}. Reserved: ${usage.reservedBytes}, Used: ${usage.usedBytes}`,
      );
    });
  }

  /**
   * 예약 취소 (트랜잭션 + row lock)
   */
  async releaseBytes(siteId: string, sizeBytes: number): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const usage = await manager.findOne(SiteStorageUsage, {
        where: { siteId: siteId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!usage) {
        // 이미 삭제되었거나 존재하지 않음 (idempotent)
        this.logger.warn(`Storage usage not found for site ${siteId}, skipping release`);
        return;
      }

      // reservedBytes 감소 (Big.js로 정확한 계산)
      const reserved = new Big(usage.reservedBytes);
      const toRelease = new Big(sizeBytes);
      const newReserved = reserved.minus(toRelease);

      // 음수 방지
      if (newReserved.lt(0)) {
        this.logger.warn(`Reserved bytes became negative for site ${siteId}. Setting to 0.`);
        usage.reservedBytes = 0;
      } else {
        usage.reservedBytes = newReserved.toNumber();
      }

      await manager.save(SiteStorageUsage, usage);

      this.logger.log(
        `Released ${sizeBytes} bytes for site ${siteId}. Reserved: ${usage.reservedBytes}, Used: ${usage.usedBytes}`,
      );
    });
  }

  /**
   * 사용 중인 용량 해제 (트랜잭션 + row lock)
   * cleanup job에서 orphaned PostImage 삭제 시 사용
   */
  async releaseUsedBytes(siteId: string, sizeBytes: number): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const usage = await manager.findOne(SiteStorageUsage, {
        where: { siteId: siteId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!usage) {
        // 이미 삭제되었거나 존재하지 않음 (idempotent)
        this.logger.warn(`Storage usage not found for site ${siteId}, skipping release used bytes`);
        return;
      }

      // usedBytes 감소 (Big.js로 정확한 계산)
      const used = new Big(usage.usedBytes);
      const toRelease = new Big(sizeBytes);
      const newUsed = used.minus(toRelease);

      // 음수 방지
      if (newUsed.lt(0)) {
        this.logger.warn(`Used bytes became negative for site ${siteId}. Setting to 0.`);
        usage.usedBytes = 0;
      } else {
        usage.usedBytes = newUsed.toNumber();
      }

      await manager.save(SiteStorageUsage, usage);

      this.logger.log(
        `Released ${sizeBytes} used bytes for site ${siteId}. Reserved: ${usage.reservedBytes}, Used: ${usage.usedBytes}`,
      );
    });
  }
}
