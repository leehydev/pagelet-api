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
    site_id: string;
    post_id: string | null;
    s3_key: string;
    size_bytes: number;
    mime_type: string;
    image_type: string;
  }): Promise<PostImage> {
    const postImage = this.postImageRepository.create(data);
    const saved = await this.postImageRepository.save(postImage);
    this.logger.log(`Created PostImage: ${saved.id} for site: ${data.site_id}`);
    return saved;
  }

  /**
   * s3Key로 조회 (post_id가 null인 것)
   */
  async findByS3Key(s3Key: string): Promise<PostImage | null> {
    return this.postImageRepository.findOne({
      where: { s3_key: s3Key, post_id: IsNull() },
    });
  }

  /**
   * site_id와 s3Key로 조회
   */
  async findBySiteIdAndS3Key(siteId: string, s3Key: string): Promise<PostImage | null> {
    return this.postImageRepository.findOne({
      where: { site_id: siteId, s3_key: s3Key },
    });
  }

  /**
   * post_id와 image_type으로 조회
   */
  async findByPostIdAndType(
    postId: string,
    imageType: string,
  ): Promise<PostImage[]> {
    return this.postImageRepository.find({
      where: { post_id: postId, image_type: imageType },
    });
  }

  /**
   * 업로드 완료 후 post_id 연결
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

    postImage.post_id = postId;
    postImage.size_bytes = actualSizeBytes;
    postImage.mime_type = mimeType;

    const updated = await this.postImageRepository.save(postImage);
    this.logger.log(`Updated PostImage ${postImageId}: connected to post ${postId}`);
    return updated;
  }

  /**
   * PostImage 삭제
   */
  async deleteByS3Key(s3Key: string): Promise<void> {
    const result = await this.postImageRepository.delete({ s3_key: s3Key });
    if (result.affected && result.affected > 0) {
      this.logger.log(`Deleted PostImage with s3Key: ${s3Key}`);
    }
  }

  /**
   * post_id가 null이고 지정된 시간 이상 된 레코드 조회 (Cleanup용)
   */
  async findOrphaned(olderThanMinutes: number): Promise<PostImage[]> {
    const olderThan = new Date();
    olderThan.setMinutes(olderThan.getMinutes() - olderThanMinutes);

    return this.postImageRepository
      .createQueryBuilder('postImage')
      .where('postImage.post_id IS NULL')
      .andWhere('postImage.created_at < :olderThan', { olderThan })
      .getMany();
  }
}
