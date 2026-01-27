import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { DraftImage } from './entities/draft-image.entity';
import { PostImage } from '../storage/entities/post-image.entity';
import { S3Service } from '../storage/s3.service';
import { StorageUsageService } from '../storage/storage-usage.service';

@Injectable()
export class DraftImageService {
  private readonly logger = new Logger(DraftImageService.name);
  private readonly cdnUrl: string;

  constructor(
    @InjectRepository(DraftImage)
    private readonly draftImageRepository: Repository<DraftImage>,
    @InjectRepository(PostImage)
    private readonly postImageRepository: Repository<PostImage>,
    private readonly s3Service: S3Service,
    @Inject(forwardRef(() => StorageUsageService))
    private readonly storageUsageService: StorageUsageService,
    private readonly configService: ConfigService,
  ) {
    this.cdnUrl = this.configService.get<string>('ASSETS_CDN_URL', '');
  }

  /**
   * Draft 이미지 동기화
   * contentHtml과 ogImageUrl에서 이미지 URL을 추출하여 DraftImage와 동기화
   */
  async syncImages(
    draftId: string,
    siteId: string,
    contentHtml: string | null,
    ogImageUrl: string | null,
  ): Promise<void> {
    // 현재 사용 중인 이미지 URL 추출
    const usedUrls = this.extractImageUrls(contentHtml, ogImageUrl);
    const usedS3Keys = usedUrls
      .map((url) => this.urlToS3Key(url))
      .filter((key): key is string => key !== null);

    // 현재 Draft에 연결된 이미지 조회
    const existingImages = await this.draftImageRepository.find({
      where: { draftId },
    });
    const existingS3Keys = existingImages.map((img) => img.s3Key);

    // 새로 추가된 이미지 연결 (PostImage에서 가져오기)
    const newKeys = usedS3Keys.filter((key) => !existingS3Keys.includes(key));
    for (const s3Key of newKeys) {
      // PostImage에서 해당 이미지 정보 조회
      const postImage = await this.postImageRepository.findOne({
        where: { s3Key, siteId },
      });

      if (postImage) {
        // DraftImage로 복사
        const draftImage = this.draftImageRepository.create({
          draftId,
          siteId,
          s3Key: postImage.s3Key,
          sizeBytes: postImage.sizeBytes,
          mimeType: postImage.mimeType,
          imageType: postImage.imageType,
          pendingDelete: false,
        });
        await this.draftImageRepository.save(draftImage);
        this.logger.debug(`Linked image to draft: ${s3Key}`);
      }
    }

    // 삭제된 이미지 pendingDelete 표시
    const removedKeys = existingS3Keys.filter((key) => !usedS3Keys.includes(key));
    for (const s3Key of removedKeys) {
      await this.draftImageRepository.update({ draftId, s3Key }, { pendingDelete: true });
      this.logger.debug(`Marked image for deletion: ${s3Key}`);
    }

    // pendingDelete였던 이미지가 다시 사용되면 복원
    const restoredKeys = usedS3Keys.filter((key) => existingS3Keys.includes(key));
    for (const s3Key of restoredKeys) {
      await this.draftImageRepository.update({ draftId, s3Key }, { pendingDelete: false });
    }
  }

  /**
   * Draft 이미지를 Post 이미지로 이전
   */
  async transferToPost(draftId: string, postId: string, siteId: string): Promise<void> {
    const draftImages = await this.draftImageRepository.find({
      where: { draftId, pendingDelete: false },
    });

    for (const draftImage of draftImages) {
      // PostImage에서 해당 이미지 찾아서 postId 연결
      await this.postImageRepository.update({ s3Key: draftImage.s3Key, siteId }, { postId });
      this.logger.debug(`Transferred image to post: ${draftImage.s3Key}`);
    }

    // DraftImage 레코드는 Draft 삭제 시 CASCADE로 삭제됨
  }

  /**
   * pendingDelete 상태인 오래된 이미지 정리
   */
  async cleanupPendingDeleteImages(hoursOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

    const pendingImages = await this.draftImageRepository
      .createQueryBuilder('di')
      .where('di.pending_delete = true')
      .andWhere('di.created_at < :cutoff', { cutoff: cutoffDate })
      .getMany();

    if (pendingImages.length === 0) {
      return 0;
    }

    for (const image of pendingImages) {
      try {
        // S3에서 삭제
        await this.s3Service.deleteObject(image.s3Key);

        // 스토리지 사용량 해제
        await this.storageUsageService.releaseUsedBytes(image.siteId, image.sizeBytes);

        // DraftImage 레코드 삭제
        await this.draftImageRepository.remove(image);

        this.logger.log(`Cleaned up pending delete image: ${image.s3Key}`);
      } catch (error) {
        this.logger.error(`Failed to cleanup image ${image.s3Key}: ${error.message}`);
      }
    }

    return pendingImages.length;
  }

  /**
   * 고아 DraftImage 정리 (draftId가 삭제된 Draft 참조)
   */
  async cleanupOrphanedImages(): Promise<number> {
    // draftId가 존재하지 않는 Draft를 참조하는 이미지 찾기
    const orphanedImages = await this.draftImageRepository
      .createQueryBuilder('di')
      .leftJoin('post_drafts', 'pd', 'pd.id = di.draft_id')
      .where('pd.id IS NULL')
      .getMany();

    if (orphanedImages.length === 0) {
      return 0;
    }

    for (const image of orphanedImages) {
      try {
        await this.s3Service.deleteObject(image.s3Key);
        await this.storageUsageService.releaseUsedBytes(image.siteId, image.sizeBytes);
        await this.draftImageRepository.remove(image);
        this.logger.log(`Cleaned up orphaned draft image: ${image.s3Key}`);
      } catch (error) {
        this.logger.error(`Failed to cleanup orphaned image ${image.s3Key}: ${error.message}`);
      }
    }

    return orphanedImages.length;
  }

  /**
   * HTML과 OG 이미지에서 이미지 URL 추출
   */
  private extractImageUrls(contentHtml: string | null, ogImageUrl: string | null): string[] {
    const urls: string[] = [];

    if (contentHtml) {
      // img 태그에서 src 추출
      const imgRegex = /<img[^>]+src="([^"]+)"/gi;
      let match;
      while ((match = imgRegex.exec(contentHtml)) !== null) {
        if (match[1] && this.isOurCdnUrl(match[1])) {
          urls.push(match[1]);
        }
      }
    }

    if (ogImageUrl && this.isOurCdnUrl(ogImageUrl)) {
      urls.push(ogImageUrl);
    }

    return [...new Set(urls)]; // 중복 제거
  }

  /**
   * URL이 우리 CDN URL인지 확인
   */
  private isOurCdnUrl(url: string): boolean {
    return url.startsWith(this.cdnUrl);
  }

  /**
   * CDN URL을 S3 Key로 변환
   */
  private urlToS3Key(url: string): string | null {
    if (!this.isOurCdnUrl(url)) {
      return null;
    }
    return url.replace(this.cdnUrl + '/', '');
  }
}
