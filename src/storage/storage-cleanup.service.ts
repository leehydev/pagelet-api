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
   * post_id가 null이고 24시간 이상 된 레코드 정리
   * (게시글 저장을 하지 않은 경우를 고려하여 충분한 시간 제공)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOrphanedReservations() {
    this.logger.log('Starting cleanup of orphaned reservations...');

    try {
      // post_id가 null이고 24시간(1440분) 이상 된 레코드 찾기
      const orphaned = await this.postImageService.findOrphaned(1440);

      if (orphaned.length === 0) {
        this.logger.log('No orphaned reservations found');
        return;
      }

      this.logger.log(`Found ${orphaned.length} orphaned reservations`);

      for (const image of orphaned) {
        try {
          // completeUpload가 호출되었는지 확인할 수 없으므로
          // 두 가지 경우를 모두 처리:
          // 1. completeUpload가 호출된 경우: used_bytes에서 해제
          // 2. completeUpload가 호출되지 않은 경우: reserved_bytes에서 해제
          //
          // 두 메서드 모두 idempotent하므로 (음수 방지),
          // 둘 다 호출해도 안전함
          //
          // 실제로는 completeUpload가 호출되면 reserved_bytes가 이미 0이 되었을 것이므로
          // releaseBytes는 효과가 없고, releaseUsedBytes만 효과가 있음
          // completeUpload가 호출되지 않았다면 reserved_bytes에 있을 것이므로
          // releaseBytes만 효과가 있고, releaseUsedBytes는 효과가 없음 (0에서 빼도 0)

          // reserved_bytes에서 해제 (completeUpload가 호출되지 않은 경우)
          await this.storageUsageService.releaseBytes(image.siteId, image.sizeBytes);

          // used_bytes에서 해제 (completeUpload가 호출된 경우)
          await this.storageUsageService.releaseUsedBytes(image.siteId, image.sizeBytes);

          // (선택) S3 오브젝트 삭제
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
}
