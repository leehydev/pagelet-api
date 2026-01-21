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
   * GET /public/posts?site_slug=xxx&category_slug=xxx
   * 공개 게시글 목록 조회 (PUBLISHED만)
   * category_slug가 제공되면 해당 카테고리의 게시글만 조회
   */
  @Get()
  async getPublicPosts(
    @Query('site_slug') siteSlug: string,
    @Query('category_slug') categorySlug?: string,
  ): Promise<PublicPostResponseDto[]> {
    if (!siteSlug) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'site_slug query parameter is required',
      );
    }

    // site_slug로 사이트 조회
    const site = await this.siteService.findBySlug(siteSlug);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    // category_slug가 제공되면 카테고리별 게시글 조회
    const posts = categorySlug
      ? await this.postService.findPublishedBySiteIdAndCategorySlug(site.id, categorySlug)
      : await this.postService.findPublishedBySiteId(site.id);

    return posts.map(
      (post) =>
        new PublicPostResponseDto({
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          published_at: post.publishedAt!,
          seo_title: post.seoTitle,
          seo_description: post.seoDescription,
          og_image_url: post.ogImageUrl,
        }),
    );
  }

  /**
   * GET /public/posts/:slug?site_slug=xxx
   * 공개 게시글 상세 조회
   */
  @Get(':slug')
  async getPublicPostBySlug(
    @Param('slug') postSlug: string,
    @Query('site_slug') siteSlug: string,
  ): Promise<PublicPostResponseDto> {
    if (!siteSlug) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'site_slug query parameter is required',
      );
    }

    // site_slug로 사이트 조회
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
      slug: post.slug,
      content: post.content,
      published_at: post.publishedAt!,
      seo_title: post.seoTitle,
      seo_description: post.seoDescription,
      og_image_url: post.ogImageUrl,
    });
  }
}
