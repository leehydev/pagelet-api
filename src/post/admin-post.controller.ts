import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostService } from './post.service';
import { PostDraftService } from './post-draft.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';
import { AdminSiteGuard } from '../auth/guards/admin-site.guard';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PaginationQueryDto, PaginatedResponseDto } from '../common/dto';
import { PostListResponseDto, PostResponseDto } from './dto/post-response.dto';
import { PostDraftResponseDto } from './dto/post-draft-response.dto';
import { PostSearchResultDto } from './dto/post-search-result.dto';
import { Site } from '../site/entities/site.entity';

@ApiTags('Admin Posts')
@Controller('admin/sites/:siteId/posts')
@UseGuards(AdminSiteGuard)
export class AdminPostController {
  constructor(
    private readonly postService: PostService,
    private readonly postDraftService: PostDraftService,
  ) {}

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
   * categoryId가 제공되면 해당 카테고리의 게시글만 조회
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
   * 게시글 검색 (오토컴플리트용, PUBLISHED 상태만)
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
   * 게시글 단건 조회 (편집/상세 보기용)
   * contentJson + contentHtml 포함
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

    // 게시글이 없거나 다른 사이트의 게시글인 경우 404
    if (!post || post.siteId !== site.id) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    // 드래프트 존재 여부 확인
    const hasDraft = await this.postDraftService.hasDraft(postId);

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
      hasDraft,
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
  @ApiOperation({ summary: '게시글 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  async deletePost(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<{ success: boolean }> {
    await this.postService.deletePost(postId, site.id);
    return { success: true };
  }

  // ==================== Draft Endpoints ====================

  /**
   * GET /admin/sites/:siteId/posts/:id/draft
   * 드래프트 조회
   */
  @Get(':id/draft')
  @ApiOperation({ summary: '게시글 드래프트 조회' })
  @ApiResponse({ status: 200, description: '드래프트 조회 성공', type: PostDraftResponseDto })
  @ApiResponse({ status: 404, description: '게시글 또는 드래프트를 찾을 수 없음' })
  async getDraft(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<PostDraftResponseDto | null> {
    // 게시글 존재 및 권한 확인
    const post = await this.postService.findById(postId);
    if (!post || post.siteId !== site.id) {
      throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
    }

    const draft = await this.postDraftService.findByPostId(postId);
    if (!draft) {
      return null;
    }

    return new PostDraftResponseDto({
      id: draft.id,
      postId: draft.postId,
      title: draft.title,
      subtitle: draft.subtitle,
      slug: draft.slug,
      contentJson: draft.contentJson,
      contentHtml: draft.contentHtml,
      contentText: draft.contentText,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      ogImageUrl: draft.ogImageUrl,
      categoryId: draft.categoryId,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    });
  }

  /**
   * PUT /admin/sites/:siteId/posts/:id/draft
   * 드래프트 저장 (upsert)
   */
  @Put(':id/draft')
  @ApiOperation({ summary: '게시글 드래프트 저장 (자동저장)' })
  @ApiResponse({ status: 200, description: '드래프트 저장 성공', type: PostDraftResponseDto })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async saveDraft(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
    @Body() dto: SaveDraftDto,
  ): Promise<PostDraftResponseDto> {
    const draft = await this.postDraftService.saveDraft(postId, site.id, dto);

    return new PostDraftResponseDto({
      id: draft.id,
      postId: draft.postId,
      title: draft.title,
      subtitle: draft.subtitle,
      slug: draft.slug,
      contentJson: draft.contentJson,
      contentHtml: draft.contentHtml,
      contentText: draft.contentText,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      ogImageUrl: draft.ogImageUrl,
      categoryId: draft.categoryId,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    });
  }

  /**
   * DELETE /admin/sites/:siteId/posts/:id/draft
   * 변경 취소 (드래프트 삭제)
   */
  @Delete(':id/draft')
  @ApiOperation({ summary: '드래프트 삭제 (변경 취소)' })
  @ApiResponse({ status: 200, description: '드래프트 삭제 성공' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async deleteDraft(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<{ success: boolean }> {
    await this.postDraftService.deleteDraft(postId, site.id);
    return { success: true };
  }

  /**
   * POST /admin/sites/:siteId/posts/:id/publish
   * 발행 (PRIVATE -> PUBLISHED)
   * 드래프트가 있으면 드래프트 내용을 게시글에 적용 후 발행
   */
  @Post(':id/publish')
  @ApiOperation({ summary: '게시글 발행' })
  @ApiResponse({ status: 200, description: '발행 성공', type: PostResponseDto })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async publishPost(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<PostResponseDto> {
    const post = await this.postDraftService.applyDraftToPost(postId, site.id);

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
      hasDraft: false,
    });
  }

  /**
   * POST /admin/sites/:siteId/posts/:id/republish
   * 재발행 (이미 PUBLISHED 상태인 게시글의 드래프트 적용)
   */
  @Post(':id/republish')
  @ApiOperation({ summary: '게시글 재발행 (드래프트 적용)' })
  @ApiResponse({ status: 200, description: '재발행 성공', type: PostResponseDto })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async republishPost(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<PostResponseDto> {
    // publish와 동일한 로직: 드래프트 내용을 게시글에 적용
    const post = await this.postDraftService.applyDraftToPost(postId, site.id);

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
      hasDraft: false,
    });
  }

  /**
   * POST /admin/sites/:siteId/posts/:id/unpublish
   * 비공개 전환 (PUBLISHED -> PRIVATE)
   * 드래프트가 있으면 드래프트 내용을 게시글에 머지 후 비공개 전환
   */
  @Post(':id/unpublish')
  @ApiOperation({ summary: '게시글 비공개 전환' })
  @ApiResponse({ status: 200, description: '비공개 전환 성공', type: PostResponseDto })
  @ApiResponse({ status: 400, description: '게시글이 발행 상태가 아님' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  async unpublishPost(
    @CurrentSite() site: Site,
    @Param('id') postId: string,
  ): Promise<PostResponseDto> {
    const post = await this.postService.unpublishPost(postId, site.id);

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
      hasDraft: false,
    });
  }
}
