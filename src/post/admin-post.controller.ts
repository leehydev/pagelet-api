import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';
import { SiteService } from '../site/site.service';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PostListResponseDto, PostResponseDto } from './dto/post-response.dto';

@Controller('admin/posts')
export class AdminPostController {
  constructor(
    private readonly postService: PostService,
    private readonly siteService: SiteService,
  ) {}

  /**
   * POST /admin/posts
   * 게시글 생성
   */
  @Post()
  async createPost(
    @CurrentUser() user: UserPrincipal,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    // 사용자의 사이트 조회
    const site = await this.siteService.findByUserId(user.userId);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const post = await this.postService.createPost(user.userId, site.id, dto);

    return new PostResponseDto({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      status: post.status,
      published_at: post.publishedAt,
      seo_title: post.seoTitle,
      seo_description: post.seoDescription,
      og_image_url: post.ogImageUrl,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    });
  }

  /**
   * GET /admin/posts?category_id=xxx
   * 내 게시글 목록 조회
   * category_id가 제공되면 해당 카테고리의 게시글만 조회
   */
  @Get()
  async getMyPosts(
    @CurrentUser() user: UserPrincipal,
    @Query('category_id') categoryId?: string,
  ): Promise<PostListResponseDto[]> {
    // 사용자의 사이트 조회
    const site = await this.siteService.findByUserId(user.userId);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const posts = await this.postService.findByUserId(user.userId, site.id, categoryId);

    return posts.map(
      (post) =>
        new PostListResponseDto({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          published_at: post.publishedAt,
          seo_description: post.seoDescription,
          og_image_url: post.ogImageUrl,
          created_at: post.createdAt,
        }),
    );
  }

  /**
   * GET /admin/posts/check-slug?slug=xxx
   * slug 사용 가능 여부 확인
   */
  @Get('check-slug')
  async checkSlugAvailability(
    @CurrentUser() user: UserPrincipal,
    @Query('slug') slug: string,
  ): Promise<{ available: boolean }> {
    if (!slug) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'slug query parameter is required',
      );
    }

    const site = await this.siteService.findByUserId(user.userId);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const available = await this.postService.isSlugAvailable(site.id, slug);
    return { available };
  }
}
