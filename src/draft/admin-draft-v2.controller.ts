import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { DraftService } from './draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { DraftResponseDto, DraftListResponseDto } from './dto/draft-response.dto';
import { PostResponseDto } from '../post/dto/post-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';
import { AdminSiteHeaderGuard } from '../auth/guards/admin-site-header.guard';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { Site } from '../site/entities/site.entity';

/**
 * AdminDraftV2Controller
 * 독립적인 Draft(임시저장 글) 관리 API
 * X-Site-Id 헤더 기반 인증
 */
@ApiTags('Admin Drafts V2')
@Controller('admin/v2/drafts')
@UseGuards(AdminSiteHeaderGuard)
export class AdminDraftV2Controller {
  constructor(private readonly draftService: DraftService) {}

  /**
   * GET /admin/v2/drafts
   * 임시저장 글 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '임시저장 글 목록 조회' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  async getDrafts(
    @CurrentUser() user: UserPrincipal,
    @CurrentSite() site: Site,
  ): Promise<DraftListResponseDto[]> {
    const drafts = await this.draftService.findBySiteId(site.id, user.userId);

    return drafts.map(
      (draft) =>
        new DraftListResponseDto({
          id: draft.id,
          title: draft.title,
          subtitle: draft.subtitle,
          ogImageUrl: draft.ogImageUrl,
          categoryName: draft.category?.name || null,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
        }),
    );
  }

  /**
   * POST /admin/v2/drafts
   * 새 임시저장 글 생성
   */
  @Post()
  @ApiOperation({ summary: '임시저장 글 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  async createDraft(
    @CurrentUser() user: UserPrincipal,
    @CurrentSite() site: Site,
    @Body() dto: CreateDraftDto,
  ): Promise<DraftResponseDto> {
    const draft = await this.draftService.createDraft(site.id, user.userId, dto);

    return new DraftResponseDto({
      id: draft.id,
      siteId: draft.siteId,
      userId: draft.userId,
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
      expiresAt: draft.expiresAt,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    });
  }

  /**
   * GET /admin/v2/drafts/:id
   * 임시저장 글 상세 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '임시저장 글 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '임시저장 글을 찾을 수 없음' })
  async getDraft(
    @CurrentUser() user: UserPrincipal,
    @CurrentSite() site: Site,
    @Param('id') id: string,
  ): Promise<DraftResponseDto> {
    const draft = await this.draftService.findById(id);

    if (!draft || draft.siteId !== site.id || draft.userId !== user.userId) {
      throw BusinessException.fromErrorCode(ErrorCode.DRAFT_NOT_FOUND);
    }

    return new DraftResponseDto({
      id: draft.id,
      siteId: draft.siteId,
      userId: draft.userId,
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
      categoryName: draft.category?.name || null,
      expiresAt: draft.expiresAt,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    });
  }

  /**
   * PUT /admin/v2/drafts/:id
   * 임시저장 글 수정
   */
  @Put(':id')
  @ApiOperation({ summary: '임시저장 글 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '임시저장 글을 찾을 수 없음' })
  async updateDraft(
    @CurrentUser() user: UserPrincipal,
    @CurrentSite() site: Site,
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
  ): Promise<DraftResponseDto> {
    const draft = await this.draftService.updateDraft(id, site.id, user.userId, dto);

    return new DraftResponseDto({
      id: draft.id,
      siteId: draft.siteId,
      userId: draft.userId,
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
      expiresAt: draft.expiresAt,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    });
  }

  /**
   * DELETE /admin/v2/drafts/:id
   * 임시저장 글 삭제
   */
  @Delete(':id')
  @ApiOperation({ summary: '임시저장 글 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '임시저장 글을 찾을 수 없음' })
  async deleteDraft(
    @CurrentUser() user: UserPrincipal,
    @CurrentSite() site: Site,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.draftService.deleteDraft(id, site.id, user.userId);
    return { success: true };
  }

  /**
   * POST /admin/v2/drafts/:id/publish
   * 임시저장 글을 게시글로 등록
   */
  @Post(':id/publish')
  @ApiOperation({ summary: '임시저장 글을 게시글로 등록' })
  @ApiResponse({ status: 200, description: '등록 성공' })
  @ApiResponse({ status: 404, description: '임시저장 글을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: 'slug 중복' })
  async publishDraft(
    @CurrentUser() user: UserPrincipal,
    @CurrentSite() site: Site,
    @Param('id') id: string,
  ): Promise<PostResponseDto> {
    const post = await this.draftService.publishDraft(id, site.id, user.userId);

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
