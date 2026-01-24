import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PostImageService } from '../storage/post-image.service';
import { S3Service } from '../storage/s3.service';
import { CategoryService } from '../category/category.service';
import { PaginatedResponseDto } from '../common/dto';
import { PostDraftService } from './post-draft.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly postImageService: PostImageService,
    private readonly s3Service: S3Service,
    @Inject(forwardRef(() => CategoryService))
    private readonly categoryService: CategoryService,
    @Inject(forwardRef(() => PostDraftService))
    private readonly postDraftService: PostDraftService,
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
    const status = dto.status || PostStatus.PRIVATE;
    const publishedAt = status === PostStatus.PUBLISHED ? new Date() : null;

    // category 처리: 제공되지 않으면 기본 카테고리 할당
    let categoryId = dto.categoryId || null;
    if (!categoryId) {
      const defaultCategory = await this.categoryService.ensureDefaultCategory(siteId);
      categoryId = defaultCategory.id;
    } else {
      // category가 해당 site에 속하는지 확인
      const category = await this.categoryService.findById(categoryId);
      if (!category || category.siteId !== siteId) {
        throw BusinessException.fromErrorCode(ErrorCode.CATEGORY_NOT_FOUND);
      }
    }

    const post = this.postRepository.create({
      userId: userId,
      siteId: siteId,
      title: dto.title,
      subtitle: dto.subtitle,
      slug,
      content: dto.content || undefined, // Deprecated: 하위 호환성
      contentJson: dto.contentJson,
      contentHtml: dto.contentHtml || undefined,
      contentText: dto.contentText || undefined,
      status,
      publishedAt: publishedAt,
      seoTitle: dto.seoTitle || undefined,
      seoDescription: dto.seoDescription || undefined,
      ogImageUrl: dto.ogImageUrl || undefined,
      categoryId: categoryId,
    });

    const saved = await this.postRepository.save(post);
    this.logger.log(`Created post: ${saved.id} for user: ${userId}, status: ${status}`);

    // 이미지 동기화 (contentHtml + ogImageUrl의 이미지를 postId와 연결)
    await this.syncPostImages(siteId, saved.id, saved.contentHtml, saved.ogImageUrl);

    return saved;
  }

  /**
   * Public URL에서 s3Key 추출
   * @returns s3Key 또는 null (S3 URL이 아닌 경우)
   */
  private extractS3KeyFromUrl(imageUrl: string): string | null {
    const baseUrl = this.s3Service.getAssetsCdnBaseUrl();

    if (!imageUrl.startsWith(baseUrl)) {
      // S3 URL이 아니면 무시 (외부 URL)
      return null;
    }

    // s3Key 추출: baseUrl 이후 부분
    // baseUrl이 "https://assets.pagelet-dev.kr"이고
    // imageUrl이 "https://assets.pagelet-dev.kr/uploads/..."인 경우
    return imageUrl.substring(baseUrl.length + 1); // +1은 슬래시 제거
  }

  /**
   * contentHtml과 ogImageUrl에서 S3 이미지 URL 추출
   * @returns s3Key Set
   */
  private extractS3KeysFromPost(
    contentHtml: string | null,
    ogImageUrl: string | null,
  ): Set<string> {
    const s3Keys = new Set<string>();
    const baseUrl = this.s3Service.getAssetsCdnBaseUrl();

    // 1. contentHtml에서 img 태그의 src 추출
    if (contentHtml) {
      // 정규식으로 img src 추출 (baseUrl로 시작하는 것만)
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = imgRegex.exec(contentHtml)) !== null) {
        const s3Key = this.extractS3KeyFromUrl(match[1]);
        if (s3Key) {
          s3Keys.add(s3Key);
        }
      }
    }

    // 2. ogImageUrl 추가
    if (ogImageUrl) {
      const s3Key = this.extractS3KeyFromUrl(ogImageUrl);
      if (s3Key) {
        s3Keys.add(s3Key);
      }
    }

    return s3Keys;
  }

  /**
   * 게시글 저장 시 이미지 동기화
   * - contentHtml + ogImageUrl에 있는 이미지 → postId 연결
   * - 기존에 연결되었지만 더 이상 사용되지 않는 이미지 → postId = null (cleanup 대상)
   */
  async syncPostImages(
    siteId: string,
    postId: string,
    contentHtml: string | null,
    ogImageUrl: string | null,
  ): Promise<void> {
    try {
      // 1. 현재 게시글에서 사용 중인 S3 이미지 추출
      const currentS3Keys = this.extractS3KeysFromPost(contentHtml, ogImageUrl);

      // 2. 기존에 이 게시글에 연결된 이미지들 조회
      const existingImages = await this.postImageService.findByPostId(postId);
      const existingS3Keys = new Set(existingImages.map((img) => img.s3Key));

      // 3. 새로 연결해야 할 이미지 (현재 사용 중이지만 기존에 연결 안 됨)
      for (const s3Key of currentS3Keys) {
        if (!existingS3Keys.has(s3Key)) {
          const linked = await this.postImageService.linkToPost(siteId, s3Key, postId);
          if (linked) {
            this.logger.log(`Linked s3Key ${s3Key} to post ${postId}`);
          }
        }
      }

      // 4. 연결 해제해야 할 이미지 (기존에 연결되었지만 더 이상 사용 안 함)
      for (const existingImage of existingImages) {
        if (!currentS3Keys.has(existingImage.s3Key)) {
          await this.postImageService.unlinkFromPost(existingImage.id);
          this.logger.log(
            `Unlinked s3Key ${existingImage.s3Key} from post ${postId} (cleanup target)`,
          );
        }
      }

      this.logger.log(`Synced images for post ${postId}: ${currentS3Keys.size} images in use`);
    } catch (error) {
      // 이미지 동기화 실패해도 게시글 저장은 성공 처리
      this.logger.warn(`Failed to sync images for post ${postId}: ${error.message}`);
    }
  }

  /**
   * 게시글 조회 by ID
   */
  async findById(postId: string): Promise<Post | null> {
    return this.postRepository.findOne({ where: { id: postId } });
  }

  /**
   * 사용자의 게시글 목록 조회 (Admin용) - 페이징 지원
   */
  async findByUserId(
    userId: string,
    siteId: string,
    options: { categoryId?: string; page?: number; limit?: number } = {},
  ): Promise<PaginatedResponseDto<Post>> {
    const { categoryId, page = 1, limit = 10 } = options;
    const where: any = { userId: userId, siteId: siteId };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [posts, totalItems] = await this.postRepository.findAndCount({
      where,
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return PaginatedResponseDto.create(posts, totalItems, page, limit);
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
      relations: ['category'],
      order: { publishedAt: 'DESC' },
    });
  }

  /**
   * ID로 발행된 게시글 조회 (Public용)
   */
  async findPublishedById(siteId: string, postId: string): Promise<Post | null> {
    return this.postRepository.findOne({
      where: {
        id: postId,
        siteId: siteId,
        status: PostStatus.PUBLISHED,
      },
      relations: ['category'],
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
      relations: ['category'],
    });
  }

  /**
   * 카테고리 slug로 발행된 게시글 목록 조회 (Public용)
   */
  async findPublishedBySiteIdAndCategorySlug(
    siteId: string,
    categorySlug: string,
  ): Promise<Post[]> {
    const category = await this.categoryService.findBySlug(siteId, categorySlug);
    if (!category) {
      return [];
    }

    return this.postRepository.find({
      where: {
        siteId: siteId,
        categoryId: category.id,
        status: PostStatus.PUBLISHED,
      },
      relations: ['category'],
      order: { publishedAt: 'DESC' },
    });
  }

  /**
   * 게시글 삭제
   * - 연결된 이미지는 postId를 null로 설정하여 cleanup 대상으로 만듦
   */
  async deletePost(postId: string, siteId: string): Promise<void> {
    // 게시글 조회
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post || post.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    // 연결된 이미지들의 postId를 null로 설정 (cleanup 대상)
    const linkedImages = await this.postImageService.findByPostId(postId);
    for (const image of linkedImages) {
      await this.postImageService.unlinkFromPost(image.id);
      this.logger.log(`Unlinked image ${image.s3Key} from post ${postId} for deletion`);
    }

    // 게시글 삭제
    await this.postRepository.remove(post);
    this.logger.log(`Deleted post: ${postId}`);
  }

  /**
   * 게시글 검색 (오토컴플리트용)
   * PUBLISHED 상태의 게시글만 검색
   */
  async searchPosts(siteId: string, query: string, limit: number = 10): Promise<Post[]> {
    const searchQuery = `%${query}%`;

    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .where('post.siteId = :siteId', { siteId })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('(post.title ILIKE :query OR post.subtitle ILIKE :query)', { query: searchQuery })
      .orderBy('post.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 현재 게시글 기준 인접 게시글 조회
   * - 현재 게시글을 포함하여 총 5개 반환
   * - publishedAt 기준 앞뒤 2개씩
   * - 처음/끝 부분은 가능한 만큼만 반환
   */
  async findAdjacentPosts(
    siteId: string,
    currentPostId: string,
    count: number = 5,
  ): Promise<{ posts: Post[]; currentIndex: number }> {
    // 해당 사이트의 모든 PUBLISHED 게시글을 publishedAt DESC 순으로 조회
    const allPosts = await this.postRepository.find({
      where: {
        siteId: siteId,
        status: PostStatus.PUBLISHED,
      },
      order: { publishedAt: 'DESC' },
      select: ['id', 'title', 'slug', 'ogImageUrl', 'publishedAt'],
    });

    // 현재 게시글의 인덱스 찾기
    const currentIndex = allPosts.findIndex((post) => post.id === currentPostId);

    if (currentIndex === -1) {
      // 현재 게시글이 없으면 빈 배열 반환
      return { posts: [], currentIndex: -1 };
    }

    // 앞뒤 2개씩 슬라이스 (경계 처리)
    const halfCount = Math.floor(count / 2);
    let startIndex = currentIndex - halfCount;
    let endIndex = currentIndex + halfCount;

    // 경계 조정
    if (startIndex < 0) {
      // 앞에 공간이 부족하면 뒤로 더 가져옴
      endIndex = Math.min(endIndex - startIndex, allPosts.length - 1);
      startIndex = 0;
    }

    if (endIndex >= allPosts.length) {
      // 뒤에 공간이 부족하면 앞에서 더 가져옴
      startIndex = Math.max(0, startIndex - (endIndex - allPosts.length + 1));
      endIndex = allPosts.length - 1;
    }

    const adjacentPosts = allPosts.slice(startIndex, endIndex + 1);
    const newCurrentIndex = currentIndex - startIndex;

    return { posts: adjacentPosts, currentIndex: newCurrentIndex };
  }

  /**
   * 게시글 수정
   */
  async updatePost(postId: string, siteId: string, dto: UpdatePostDto): Promise<Post> {
    // 게시글 조회
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post || post.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    // slug 변경 시 중복 체크
    if (dto.slug && dto.slug !== post.slug) {
      const isAvailable = await this.isSlugAvailable(siteId, dto.slug, postId);
      if (!isAvailable) {
        throw BusinessException.fromErrorCode(ErrorCode.POST_SLUG_ALREADY_EXISTS);
      }
    }

    // categoryId 변경 시 유효성 체크
    if (dto.categoryId && dto.categoryId !== post.categoryId) {
      const category = await this.categoryService.findById(dto.categoryId);
      if (!category || category.siteId !== siteId) {
        throw BusinessException.fromErrorCode(ErrorCode.CATEGORY_NOT_FOUND);
      }
    }

    // status 변경 처리
    const newStatus = dto.status || post.status;
    let publishedAt = post.publishedAt;

    // PRIVATE → PUBLISHED로 변경 시 publishedAt 설정
    if (post.status === PostStatus.PRIVATE && newStatus === PostStatus.PUBLISHED) {
      publishedAt = new Date();
    }

    // 필드 업데이트 (제공된 값만)
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.subtitle !== undefined) post.subtitle = dto.subtitle;
    if (dto.slug !== undefined) post.slug = dto.slug;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.contentJson !== undefined) post.contentJson = dto.contentJson;
    if (dto.contentHtml !== undefined) post.contentHtml = dto.contentHtml;
    if (dto.contentText !== undefined) post.contentText = dto.contentText;
    if (dto.status !== undefined) post.status = dto.status;
    if (dto.seoTitle !== undefined) post.seoTitle = dto.seoTitle;
    if (dto.seoDescription !== undefined) post.seoDescription = dto.seoDescription;
    if (dto.ogImageUrl !== undefined) post.ogImageUrl = dto.ogImageUrl;
    if (dto.categoryId !== undefined) post.categoryId = dto.categoryId;
    post.publishedAt = publishedAt;

    const saved = await this.postRepository.save(post);
    this.logger.log(`Updated post: ${saved.id}, status: ${saved.status}`);

    // 이미지 동기화 (contentHtml + ogImageUrl의 이미지를 postId와 연결, 제거된 이미지는 unlink)
    await this.syncPostImages(siteId, saved.id, saved.contentHtml, saved.ogImageUrl);

    return saved;
  }

  /**
   * 게시글 비공개 전환
   * - PUBLISHED 상태의 게시글을 PRIVATE로 변경
   * - 드래프트가 있는 경우 드래프트 내용을 게시글에 머지 후 드래프트 삭제
   */
  async unpublishPost(postId: string, siteId: string): Promise<Post> {
    // 게시글 조회
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post || post.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    // PUBLISHED 상태 확인
    if (post.status !== PostStatus.PUBLISHED) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_PUBLISHED);
    }

    // 드래프트 확인 및 머지
    const draft = await this.postDraftService.findByPostId(postId);
    if (draft) {
      // 드래프트 내용으로 게시글 업데이트
      post.title = draft.title;
      post.subtitle = draft.subtitle;
      post.contentJson = draft.contentJson;
      post.contentHtml = draft.contentHtml;
      post.contentText = draft.contentText;
      post.seoTitle = draft.seoTitle;
      post.seoDescription = draft.seoDescription;
      post.ogImageUrl = draft.ogImageUrl;
      post.categoryId = draft.categoryId;

      // 드래프트 삭제
      await this.postDraftService.deleteDraft(postId, siteId);

      this.logger.log(`Unpublish with draft merge: ${postId}`);
    } else {
      this.logger.log(`Unpublish without draft: ${postId}`);
    }

    // status를 PRIVATE로 변경, publishedAt을 null로
    post.status = PostStatus.PRIVATE;
    post.publishedAt = null;

    const saved = await this.postRepository.save(post);

    // 이미지 동기화
    await this.syncPostImages(siteId, saved.id, saved.contentHtml, saved.ogImageUrl);

    return saved;
  }
}
