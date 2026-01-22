import { Controller, Post, Get, Patch, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';
import { AdminSiteGuard } from '../auth/guards/admin-site.guard';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PostListResponseDto, PostResponseDto } from './dto/post-response.dto';
import { Site } from '../site/entities/site.entity';

@Controller('admin/sites/:siteId/posts')
@UseGuards(AdminSiteGuard)
export class AdminPostController {
  constructor(private readonly postService: PostService) {}

  /**
   * POST /admin/sites/:siteId/posts
   * 게시글 생성
   */
  @Post()
  async createPost(
    @CurrentUser() user: UserPrincipal,
    @CurrentSite() site: Site,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.postService.createPost(user.userId, site.id, dto);

    return new PostResponseDto({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      slug: post.slug,
      content: post.content,
      contentJson: post.contentJson,
      contentHtml: post.contentHtml,
      contentText: post.contentText,
      status: post.status,
      publishedAt: post.publishedAt,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      ogImageUrl: post.ogImageUrl,
      categoryId: post.categoryId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  }

  /**
   * GET /admin/sites/:siteId/posts?categoryId=xxx
   * 내 게시글 목록 조회
   * categoryId가 제공되면 해당 카테고리의 게시글만 조회
   */
  @Get()
  async getMyPosts(
    @CurrentUser() user: UserPrincipal,
    @CurrentSite() site: Site,
    @Query('categoryId') categoryId?: string,
  ): Promise<PostListResponseDto[]> {
    const posts = await this.postService.findByUserId(user.userId, site.id, categoryId);

    return posts.map(
      (post) =>
        new PostListResponseDto({
          id: post.id,
          title: post.title,
          subtitle: post.subtitle,
          slug: post.slug,
          status: post.status,
          publishedAt: post.publishedAt,
          seoDescription: post.seoDescription,
          ogImageUrl: post.ogImageUrl,
          createdAt: post.createdAt,
          categoryId: post.categoryId,
          categoryName: post.category?.name || null,
        }),
    );
  }

  /**
   * GET /admin/sites/:siteId/posts/check-slug?slug=xxx
   * slug 사용 가능 여부 확인
   */
  @Get('check-slug')
  async checkSlugAvailability(
    @CurrentSite() site: Site,
    @Query('slug') slug: string,
  ): Promise<{ available: boolean }> {
    if (!slug) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'slug query parameter is required',
      );
    }

    const available = await this.postService.isSlugAvailable(site.id, slug);
    return { available };
  }

  /**
   * GET /admin/sites/:siteId/posts/:id
   * 게시글 단건 조회 (편집/상세 보기용)
   * contentJson + contentHtml 포함
   */
  @Get(':id')
  async getPostById(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<PostResponseDto> {
    const post = await this.postService.findById(postId);

    // 게시글이 없거나 다른 사이트의 게시글인 경우 404
    if (!post || post.siteId !== site.id) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    return new PostResponseDto({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      slug: post.slug,
      content: post.content,
      contentJson: post.contentJson,
      contentHtml: post.contentHtml,
      contentText: post.contentText,
      status: post.status,
      publishedAt: post.publishedAt,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      ogImageUrl: post.ogImageUrl,
      categoryId: post.categoryId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  }

  /**
   * PATCH /admin/sites/:siteId/posts/:id
   * 게시글 수정 (자동저장/수동저장 모두 지원)
   */
  @Patch(':id')
  async updatePost(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.postService.updatePost(postId, site.id, dto);

    return new PostResponseDto({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      slug: post.slug,
      content: post.content,
      contentJson: post.contentJson,
      contentHtml: post.contentHtml,
      contentText: post.contentText,
      status: post.status,
      publishedAt: post.publishedAt,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      ogImageUrl: post.ogImageUrl,
      categoryId: post.categoryId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  }

  /**
   * DELETE /admin/sites/:siteId/posts/:id
   * 게시글 삭제
   */
  @Delete(':id')
  async deletePost(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<{ success: boolean }> {
    await this.postService.deletePost(postId, site.id);
    return { success: true };
  }
}
