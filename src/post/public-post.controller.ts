import { Controller, Get, Query, Param } from '@nestjs/common';
import { PostService } from './post.service';
import { SiteService } from '../site/site.service';
import { CategoryService } from '../category/category.service';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PublicPostResponseDto, AdjacentPostDto } from './dto/post-response.dto';
import { PublicPostListQueryDto, PublicPostDetailQueryDto } from './dto/public-post-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { PaginatedResponseDto } from '../common/dto';

@Controller('public/posts')
@Public()
export class PublicPostController {
  constructor(
    private readonly postService: PostService,
    private readonly siteService: SiteService,
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * GET /public/posts?siteSlug=xxx&categorySlug=xxx&page=1&limit=10
   * 공개 게시글 목록 조회 (PUBLISHED만) - 페이징 지원
   * categorySlug가 제공되면 해당 카테고리의 게시글만 조회
   */
  @Get()
  async getPublicPosts(
    @Query() query: PublicPostListQueryDto,
  ): Promise<PaginatedResponseDto<PublicPostResponseDto>> {
    const { siteSlug, categorySlug, page, limit } = query;

    if (!siteSlug) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'siteSlug query parameter is required',
      );
    }

    // siteSlug로 사이트 조회
    const site = await this.siteService.findBySlug(siteSlug);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    // categorySlug가 제공되면 카테고리별 게시글 조회
    const paginatedResult = categorySlug
      ? await this.postService.findPublishedBySiteIdAndCategorySlug(site.id, categorySlug, {
          page,
          limit,
        })
      : await this.postService.findPublishedBySiteId(site.id, { page, limit });

    // Post -> PublicPostResponseDto 변환
    const items = paginatedResult.items.map(
      (post) =>
        new PublicPostResponseDto({
          id: post.id,
          title: post.title,
          subtitle: post.subtitle,
          slug: post.slug,
          content: post.content,
          contentJson: post.contentJson,
          contentHtml: post.contentHtml,
          contentText: post.contentText,
          publishedAt: post.publishedAt!,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          ogImageUrl: post.ogImageUrl,
          categoryName: post.category?.name || null,
          categorySlug: post.category?.slug || null,
        }),
    );

    return new PaginatedResponseDto(items, paginatedResult.meta);
  }

  /**
   * GET /public/posts/:slug?siteSlug=xxx&categorySlug=xxx
   * 공개 게시글 상세 조회 (slug 기반)
   * categorySlug가 제공되면 해당 카테고리 내에서 인접 게시글 조회
   */
  @Get(':slug')
  async getPublicPostBySlug(
    @Param('slug') postSlug: string,
    @Query() query: PublicPostDetailQueryDto,
  ): Promise<PublicPostResponseDto> {
    const { siteSlug, categorySlug } = query;

    if (!siteSlug) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'siteSlug query parameter is required',
      );
    }

    // siteSlug로 사이트 조회
    const site = await this.siteService.findBySlug(siteSlug);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const post = await this.postService.findPublishedBySlug(site.id, postSlug);
    if (!post) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    // categorySlug가 제공되면 해당 카테고리 내에서 인접 게시글 조회
    let categoryId: string | undefined;
    if (categorySlug) {
      const category = await this.categoryService.findBySlug(site.id, categorySlug);
      if (category) {
        categoryId = category.id;
      }
    }

    // 인접 게시글 조회 (categoryId가 있으면 해당 카테고리 내에서만)
    const { posts: adjacentPosts, currentIndex } = await this.postService.findAdjacentPosts(
      site.id,
      post.id,
      { categoryId },
    );

    const adjacentPostDtos = adjacentPosts.map(
      (adjacentPost, index) =>
        new AdjacentPostDto({
          id: adjacentPost.id,
          title: adjacentPost.title,
          slug: adjacentPost.slug,
          ogImageUrl: adjacentPost.ogImageUrl,
          publishedAt: adjacentPost.publishedAt!,
          isCurrent: index === currentIndex,
        }),
    );

    return new PublicPostResponseDto({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      slug: post.slug,
      content: post.content,
      contentJson: post.contentJson,
      contentHtml: post.contentHtml,
      contentText: post.contentText,
      publishedAt: post.publishedAt!,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      ogImageUrl: post.ogImageUrl,
      categoryName: post.category?.name || null,
      categorySlug: post.category?.slug || null,
      adjacentPosts: adjacentPostDtos,
    });
  }
}
