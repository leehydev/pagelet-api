import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PostImageService } from '../storage/post-image.service';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly postImageService: PostImageService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * slug 생성 (title 기반)
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  /**
   * slug가 사이트 내에서 사용 가능한지 확인
   */
  async isSlugAvailable(siteId: string, slug: string, excludePostId?: string): Promise<boolean> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .where('post.siteId = :siteId', { siteId })
      .andWhere('post.slug = :slug', { slug });

    if (excludePostId) {
      query.andWhere('post.id != :excludePostId', { excludePostId });
    }

    const existing = await query.getOne();
    return !existing;
  }

  /**
   * 유니크한 slug 생성 (중복 시 숫자 접미사 추가)
   */
  async generateUniqueSlug(siteId: string, title: string, excludePostId?: string): Promise<string> {
    const baseSlug = this.generateSlug(title);
    
    if (!baseSlug) {
      // 한글 등으로만 구성된 경우 timestamp 기반 slug 생성
      const timestamp = Date.now().toString(36);
      return `post-${timestamp}`;
    }

    let slug = baseSlug;
    let counter = 1;

    while (!(await this.isSlugAvailable(siteId, slug, excludePostId))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 100) {
        // 안전장치: 너무 많은 중복 시 timestamp 추가
        slug = `${baseSlug}-${Date.now().toString(36)}`;
        break;
      }
    }

    return slug;
  }

  /**
   * 게시글 생성
   */
  async createPost(userId: string, siteId: string, dto: CreatePostDto): Promise<Post> {
    // slug 처리: 제공되지 않으면 자동 생성
    let slug = dto.slug;
    if (!slug) {
      slug = await this.generateUniqueSlug(siteId, dto.title);
    } else {
      // 제공된 slug 중복 체크
      const isAvailable = await this.isSlugAvailable(siteId, slug);
      if (!isAvailable) {
        throw BusinessException.fromErrorCode(ErrorCode.POST_SLUG_ALREADY_EXISTS);
      }
    }

    // status 처리
    const status = dto.status || PostStatus.DRAFT;
    const publishedAt = status === PostStatus.PUBLISHED ? new Date() : null;

    const post = this.postRepository.create({
      userId: userId,
      siteId: siteId,
      title: dto.title,
      slug,
      content: dto.content,
      status,
      publishedAt: publishedAt,
      seoTitle: dto.seo_title || null,
      seoDescription: dto.seo_description || null,
      ogImageUrl: dto.og_image_url || null,
    });

    const saved = await this.postRepository.save(post);
    this.logger.log(`Created post: ${saved.id} for user: ${userId}, status: ${status}`);

    // ogImageUrl이 S3 URL인 경우 PostImage의 postId 연결
    if (saved.ogImageUrl) {
      await this.linkPostImageFromUrl(siteId, saved.id, saved.ogImageUrl);
    }

    return saved;
  }

  /**
   * Public URL에서 s3Key 추출하여 PostImage의 post_id 연결
   */
  private async linkPostImageFromUrl(
    siteId: string,
    postId: string,
    imageUrl: string,
  ): Promise<void> {
    try {
      // S3 Public URL에서 s3Key 추출
      // 예: https://assets.pagelet-dev.kr/uploads/siteId/timestamp-random.ext
      const baseUrl = this.s3Service.getAssetsCdnBaseUrl();

      if (!imageUrl.startsWith(baseUrl)) {
        // S3 URL이 아니면 무시 (외부 URL)
        return;
      }

      // s3Key 추출: baseUrl 이후 부분
      // baseUrl이 "https://assets.pagelet-dev.kr"이고
      // imageUrl이 "https://assets.pagelet-dev.kr/uploads/..."인 경우
      const s3Key = imageUrl.substring(baseUrl.length + 1); // +1은 슬래시 제거

      // PostImage 조회 (postId가 null인 것)
      const postImage = await this.postImageService.findBySiteIdAndS3Key(siteId, s3Key);

      if (postImage && !postImage.postId) {
        // postId가 null이면 연결
        await this.postImageService.updatePostId(
          postImage.id,
          postId,
          postImage.sizeBytes,
          postImage.mimeType,
        );
        this.logger.log(`Linked PostImage ${postImage.id} to post ${postId}`);
      }
    } catch (error) {
      // 에러가 발생해도 게시글 생성은 성공한 것으로 처리
      this.logger.warn(
        `Failed to link PostImage for post ${postId}, url: ${imageUrl}: ${error.message}`,
      );
    }
  }

  /**
   * 게시글 조회 by ID
   */
  async findById(postId: string): Promise<Post | null> {
    return this.postRepository.findOne({ where: { id: postId } });
  }

  /**
   * 사용자의 게시글 목록 조회 (Admin용)
   */
  async findByUserId(userId: string, siteId: string): Promise<Post[]> {
    return this.postRepository.find({
      where: { userId: userId, siteId: siteId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 사이트의 게시글 목록 조회
   */
  async findBySiteId(siteId: string): Promise<Post[]> {
    return this.postRepository.find({
      where: { siteId: siteId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 사이트의 발행된 게시글 목록 조회 (Public용)
   */
  async findPublishedBySiteId(siteId: string): Promise<Post[]> {
    return this.postRepository.find({
      where: { 
        siteId: siteId, 
        status: PostStatus.PUBLISHED,
      },
      order: { publishedAt: 'DESC' },
    });
  }

  /**
   * slug로 발행된 게시글 조회 (Public용)
   */
  async findPublishedBySlug(siteId: string, slug: string): Promise<Post | null> {
    return this.postRepository.findOne({
      where: {
        siteId: siteId,
        slug,
        status: PostStatus.PUBLISHED,
      },
    });
  }
}
