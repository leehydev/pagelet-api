import { Controller, Get, Query, Param } from '@nestjs/common';
import { PostService } from './post.service';
import { SiteService } from '../site/site.service';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PublicPostResponseDto } from './dto/post-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public/posts')
@Public()
export class PublicPostController {
  constructor(
    private readonly postService: PostService,
    private readonly siteService: SiteService,
  ) {}

  /**
   * GET /public/posts?siteSlug=xxx&categorySlug=xxx
   * 공개 게시글 목록 조회 (PUBLISHED만)
   * categorySlug가 제공되면 해당 카테고리의 게시글만 조회
   */
  @Get()
  async getPublicPosts(
    @Query('siteSlug') siteSlug: string,
    @Query('categorySlug') categorySlug?: string,
  ): Promise<PublicPostResponseDto[]> {
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
    const posts = categorySlug
      ? await this.postService.findPublishedBySiteIdAndCategorySlug(site.id, categorySlug)
      : await this.postService.findPublishedBySiteId(site.id);

    return posts.map(
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
  }

  /**
   * GET /public/posts/:slug?siteSlug=xxx
   * 공개 게시글 상세 조회 (slug 기반)
   */
  @Get(':slug')
  async getPublicPostBySlug(
    @Param('slug') postSlug: string,
    @Query('siteSlug') siteSlug: string,
  ): Promise<PublicPostResponseDto> {
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
    });
  }
}
