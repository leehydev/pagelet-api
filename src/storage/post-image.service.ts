import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PostImage, PostImageType } from './entities/post-image.entity';

@Injectable()
export class PostImageService {
  private readonly logger = new Logger(PostImageService.name);

  constructor(
    @InjectRepository(PostImage)
    private readonly postImageRepository: Repository<PostImage>,
  ) {}

  /**
   * PostImage 엔티티 생성
   */
  async create(data: {
    siteId: string;
    postId: string | null;
    s3Key: string;
    sizeBytes: number;
    mimeType: string;
    imageType: string;
  }): Promise<PostImage> {
    const postImage = this.postImageRepository.create(data);
    const saved = await this.postImageRepository.save(postImage);
    this.logger.log(`Created PostImage: ${saved.id} for site: ${data.siteId}`);
    return saved;
  }

  /**
   * s3Key로 조회 (postId가 null인 것)
   */
  async findByS3Key(s3Key: string): Promise<PostImage | null> {
    return this.postImageRepository.findOne({
      where: { s3Key: s3Key, postId: IsNull() },
    });
  }

  /**
   * siteId와 s3Key로 조회
   */
  async findBySiteIdAndS3Key(siteId: string, s3Key: string): Promise<PostImage | null> {
    return this.postImageRepository.findOne({
      where: { siteId: siteId, s3Key: s3Key },
    });
  }

  /**
   * postId와 imageType으로 조회
   */
  async findByPostIdAndType(postId: string, imageType: string): Promise<PostImage[]> {
    return this.postImageRepository.find({
      where: { postId: postId, imageType: imageType },
    });
  }

  /**
   * 업로드 완료 후 postId 연결
   */
  async updatePostId(
    postImageId: string,
    postId: string,
    actualSizeBytes: number,
    mimeType: string,
  ): Promise<PostImage> {
    const postImage = await this.postImageRepository.findOne({
      where: { id: postImageId },
    });

    if (!postImage) {
      throw new Error(`PostImage not found: ${postImageId}`);
    }

    postImage.postId = postId;
    postImage.sizeBytes = actualSizeBytes;
    postImage.mimeType = mimeType;

    const updated = await this.postImageRepository.save(postImage);
    this.logger.log(`Updated PostImage ${postImageId}: connected to post ${postId}`);
    return updated;
  }

  /**
   * PostImage 삭제
   */
  async deleteByS3Key(s3Key: string): Promise<void> {
    const result = await this.postImageRepository.delete({ s3Key: s3Key });
    if (result.affected && result.affected > 0) {
      this.logger.log(`Deleted PostImage with s3Key: ${s3Key}`);
    }
  }

  /**
   * postId가 null이고 지정된 시간 이상 된 레코드 조회 (Cleanup용)
   */
  async findOrphaned(olderThanMinutes: number): Promise<PostImage[]> {
    const olderThan = new Date();
    olderThan.setMinutes(olderThan.getMinutes() - olderThanMinutes);

    return this.postImageRepository
      .createQueryBuilder('postImage')
      .where('postImage.postId IS NULL')
      .andWhere('postImage.createdAt < :olderThan', { olderThan })
      .getMany();
  }
}
