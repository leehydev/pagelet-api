import { Controller, Post, Get, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ReplacePostDto } from './dto/replace-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';
import { AdminSiteGuard } from '../auth/guards/admin-site.guard';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PaginationQueryDto, PaginatedResponseDto } from '../common/dto';
import { PostListResponseDto, PostResponseDto } from './dto/post-response.dto';
import { PostSearchResultDto } from './dto/post-search-result.dto';
import { Site } from '../site/entities/site.entity';

/**
 * AdminPostController (v1)
 * URL 기반 siteId 인증
 * @deprecated v2 API (/admin/v2/posts) 사용 권장
 */
@ApiTags('Admin Posts')
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
   * GET /admin/sites/:siteId/posts?page=1&limit=10&categoryId=xxx
   * 내 게시글 목록 조회 (페이징 지원)
   */
  @Get()
  @ApiOperation({ summary: '내 게시글 목록 조회 (페이징)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '현재 페이지 (기본값: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수 (기본값: 10, 최대: 100)',
  })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: '카테고리 필터' })
  @ApiResponse({
    status: 200,
    description: '게시글 목록 및 페이지네이션 메타데이터',
  })
  async getMyPosts(
    @CurrentUser() user: UserPrincipal,
    @CurrentSite() site: Site,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('categoryId') categoryId?: string,
  ): Promise<PaginatedResponseDto<PostListResponseDto>> {
    const result = await this.postService.findByUserId(user.userId, site.id, {
      categoryId,
      page: paginationQuery.page,
      limit: paginationQuery.limit,
    });

    const items = result.items.map(
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

    return PaginatedResponseDto.create(
      items,
      result.meta.totalItems,
      result.meta.page,
      result.meta.limit,
    );
  }

  /**
   * GET /admin/sites/:siteId/posts/search?q=검색어&limit=10
   * 게시글 검색 (오토컴플리트용)
   */
  @Get('search')
  @ApiOperation({ summary: '게시글 검색 (오토컴플리트용)' })
  @ApiQuery({ name: 'q', required: true, type: String, description: '검색어' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '최대 결과 수 (기본값: 10)',
  })
  async searchPosts(
    @CurrentSite() site: Site,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<PostSearchResultDto[]> {
    if (!query) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'q query parameter is required',
      );
    }

    const limitNum = limit ? Math.min(parseInt(limit, 10), 20) : 10;
    const posts = await this.postService.searchPosts(site.id, query, limitNum);

    return posts.map(
      (post) =>
        new PostSearchResultDto({
          id: post.id,
          title: post.title,
          subtitle: post.subtitle,
          ogImageUrl: post.ogImageUrl,
          categoryName: post.category?.name || null,
          publishedAt: post.publishedAt,
          status: post.status,
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
   * 게시글 단건 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '게시글 단건 조회' })
  @ApiResponse({ status: 200, description: '게시글 조회 성공', type: PostResponseDto })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async getPostById(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<PostResponseDto> {
    const post = await this.postService.findById(postId);

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
   * PUT /admin/sites/:siteId/posts/:id
   * 게시글 전체 교체
   */
  @Put(':id')
  @ApiOperation({ summary: '게시글 전체 교체 (PUT)' })
  @ApiResponse({ status: 200, description: '교체 성공', type: PostResponseDto })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async replacePost(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
    @Body() dto: ReplacePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.postService.replacePost(postId, site.id, dto);

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
  @ApiOperation({ summary: '게시글 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  async deletePost(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<{ success: boolean }> {
    await this.postService.deletePost(postId, site.id);
    return { success: true };
  }
}
