import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostImageService } from './post-image.service';
import { StorageUsageService } from './storage-usage.service';
import { S3Service } from './s3.service';

@Injectable()
export class StorageCleanupService {
  private readonly logger = new Logger(StorageCleanupService.name);

  constructor(
    private readonly postImageService: PostImageService,
    private readonly storageUsageService: StorageUsageService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * 매 시간마다 실행되는 Cleanup Job
   * post_id가 null이고 10분 이상 된 레코드 정리
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOrphanedReservations() {
    this.logger.log('Starting cleanup of orphaned reservations...');

    try {
      // post_id가 null이고 10분 이상 된 레코드 찾기
      const orphaned = await this.postImageService.findOrphaned(10);

      if (orphaned.length === 0) {
        this.logger.log('No orphaned reservations found');
        return;
      }

      this.logger.log(`Found ${orphaned.length} orphaned reservations`);

      for (const image of orphaned) {
        try {
          // 예약 해제
          await this.storageUsageService.releaseBytes(
            image.site_id,
            image.size_bytes,
          );

          // (선택) S3 오브젝트 삭제
          try {
            await this.s3Service.deleteObject(image.s3_key);
          } catch (error) {
            this.logger.warn(
              `Failed to delete S3 object ${image.s3_key}: ${error.message}`,
            );
          }

          // PostImage 삭제
          await this.postImageService.deleteByS3Key(image.s3_key);

          this.logger.log(`Cleaned up orphaned reservation: ${image.s3_key}`);
        } catch (error) {
          this.logger.error(
            `Failed to cleanup orphaned reservation ${image.s3_key}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Cleanup completed. Processed ${orphaned.length} orphaned reservations`,
      );
    } catch (error) {
      this.logger.error(`Cleanup job failed: ${error.message}`, error.stack);
    }
  }
}
