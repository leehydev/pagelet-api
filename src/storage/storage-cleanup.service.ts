import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostImageService } from './post-image.service';
import { StorageUsageService } from './storage-usage.service';
import { S3Service } from './s3.service';
import { DraftImageService } from '../draft/draft-image.service';
import { DraftService } from '../draft/draft.service';

// 이미지 클린업 기간 (일)
const POST_IMAGE_CLEANUP_DAYS = 7;

// Draft 이미지 pendingDelete 클린업 기간 (시간)
const DRAFT_IMAGE_PENDING_DELETE_HOURS = 24;

@Injectable()
export class StorageCleanupService {
  private readonly logger = new Logger(StorageCleanupService.name);

  constructor(
    private readonly postImageService: PostImageService,
    private readonly storageUsageService: StorageUsageService,
    private readonly s3Service: S3Service,
    @Inject(forwardRef(() => DraftImageService))
    private readonly draftImageService: DraftImageService,
    @Inject(forwardRef(() => DraftService))
    private readonly draftService: DraftService,
  ) {}

  /**
   * 10분마다 실행되는 Cleanup Job
   * post_id가 null이고 7일 이상 된 레코드 정리
   */
  @Cron(CronExpression.EVERY_10_MINUTES, { timeZone: 'Asia/Seoul' })
  async cleanupOrphanedReservations() {
    this.logger.log('[스토리지 클린업] 안쓰는 이미지 예약 정리 시작...');

    try {
      // post_id가 null이고 7일 이상 된 레코드 찾기 (분 단위로 변환)
      const minutesOld = POST_IMAGE_CLEANUP_DAYS * 24 * 60;
      const orphaned = await this.postImageService.findOrphaned(minutesOld);

      if (orphaned.length === 0) {
        this.logger.log('No orphaned reservations found');
        return;
      }

      this.logger.log(`Found ${orphaned.length} orphaned reservations`);

      for (const image of orphaned) {
        try {
          // reserved_bytes에서 해제 (completeUpload가 호출되지 않은 경우)
          await this.storageUsageService.releaseBytes(image.siteId, image.sizeBytes);

          // used_bytes에서 해제 (completeUpload가 호출된 경우)
          await this.storageUsageService.releaseUsedBytes(image.siteId, image.sizeBytes);

          // S3 오브젝트 삭제
          try {
            await this.s3Service.deleteObject(image.s3Key);
          } catch (error) {
            this.logger.warn(`Failed to delete S3 object ${image.s3Key}: ${error.message}`);
          }

          // PostImage 삭제
          await this.postImageService.deleteByS3Key(image.s3Key);

          this.logger.log(`Cleaned up orphaned reservation: ${image.s3Key}`);
        } catch (error) {
          this.logger.error(
            `Failed to cleanup orphaned reservation ${image.s3Key}: ${error.message}`,
          );
        }
      }

      this.logger.log(`Cleanup completed. Processed ${orphaned.length} orphaned reservations`);
    } catch (error) {
      this.logger.error(`Cleanup job failed: ${error.message}`, error.stack);
    }
  }

  /**
   * 1시간마다 실행: Draft 이미지 정리
   * - pendingDelete가 true이고 24시간 이상 된 이미지 삭제
   * - 고아 Draft 이미지 삭제
   */
  @Cron(CronExpression.EVERY_HOUR, { timeZone: 'Asia/Seoul' })
  async cleanupDraftImages() {
    this.logger.log('[스토리지 클린업] 초안 이미지 정리 시작...');

    try {
      // pendingDelete 이미지 정리
      const pendingCount = await this.draftImageService.cleanupPendingDeleteImages(
        DRAFT_IMAGE_PENDING_DELETE_HOURS,
      );
      if (pendingCount > 0) {
        this.logger.log(`Cleaned up ${pendingCount} pending delete draft images`);
      }

      // 고아 이미지 정리
      const orphanedCount = await this.draftImageService.cleanupOrphanedImages();
      if (orphanedCount > 0) {
        this.logger.log(`Cleaned up ${orphanedCount} orphaned draft images`);
      }
    } catch (error) {
      this.logger.error(`Draft image cleanup failed: ${error.message}`, error.stack);
    }
  }

  /**
   * 매일 자정 실행: 만료된 Draft 정리
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Seoul' })
  async cleanupExpiredDrafts() {
    this.logger.log('[스토리지 클린업] 만료된 초안 정리 시작...');

    try {
      const count = await this.draftService.cleanupExpiredDrafts();
      if (count > 0) {
        this.logger.log(`Cleaned up ${count} expired drafts`);
      } else {
        this.logger.log('No expired drafts found');
      }
    } catch (error) {
      this.logger.error(`Expired drafts cleanup failed: ${error.message}`, error.stack);
    }
  }
}
