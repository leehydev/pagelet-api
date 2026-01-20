import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
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
      .where('post.site_id = :siteId', { siteId })
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
      user_id: userId,
      site_id: siteId,
      title: dto.title,
      slug,
      content: dto.content,
      status,
      published_at: publishedAt,
      seo_title: dto.seo_title || null,
      seo_description: dto.seo_description || null,
      og_image_url: dto.og_image_url || null,
    });

    const saved = await this.postRepository.save(post);
    this.logger.log(`Created post: ${saved.id} for user: ${userId}, status: ${status}`);
    return saved;
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
      where: { user_id: userId, site_id: siteId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 사이트의 게시글 목록 조회
   */
  async findBySiteId(siteId: string): Promise<Post[]> {
    return this.postRepository.find({
      where: { site_id: siteId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 사이트의 발행된 게시글 목록 조회 (Public용)
   */
  async findPublishedBySiteId(siteId: string): Promise<Post[]> {
    return this.postRepository.find({
      where: { 
        site_id: siteId, 
        status: PostStatus.PUBLISHED,
      },
      order: { published_at: 'DESC' },
    });
  }

  /**
   * slug로 발행된 게시글 조회 (Public용)
   */
  async findPublishedBySlug(siteId: string, slug: string): Promise<Post | null> {
    return this.postRepository.findOne({
      where: {
        site_id: siteId,
        slug,
        status: PostStatus.PUBLISHED,
      },
    });
  }
}
