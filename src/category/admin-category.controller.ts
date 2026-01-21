import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPrincipal } from '../auth/types/jwt-payload.interface';
import { SiteService } from '../site/site.service';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@Controller('admin/categories')
export class AdminCategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly siteService: SiteService,
  ) {}

  /**
   * GET /admin/categories
   * 카테고리 목록 조회
   */
  @Get()
  async getCategories(@CurrentUser() user: UserPrincipal): Promise<CategoryResponseDto[]> {
    const site = await this.siteService.findByUserId(user.userId);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const categories = await this.categoryService.findBySiteId(site.id);
    const categoryIds = categories.map((c) => c.id);
    const postCounts = await this.categoryService.getPostCountsByCategories(categoryIds);

    return categories.map(
      (category) =>
        new CategoryResponseDto({
          id: category.id,
          siteId: category.siteId,
          slug: category.slug,
          name: category.name,
          description: category.description,
          sortOrder: category.sortOrder,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
          postCount: postCounts.get(category.id) || 0,
        }),
    );
  }

  /**
   * POST /admin/categories
   * 카테고리 생성
   */
  @Post()
  async createCategory(
    @CurrentUser() user: UserPrincipal,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const site = await this.siteService.findByUserId(user.userId);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const category = await this.categoryService.createCategory(site.id, dto);
    const postCount = await this.categoryService.getPostCountByCategory(category.id);

    return new CategoryResponseDto({
      id: category.id,
      siteId: category.siteId,
      slug: category.slug,
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      postCount: postCount,
    });
  }

  /**
   * PUT /admin/categories/:id
   * 카테고리 수정
   */
  @Put(':id')
  async updateCategory(
    @CurrentUser() user: UserPrincipal,
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const site = await this.siteService.findByUserId(user.userId);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const category = await this.categoryService.updateCategory(categoryId, site.id, dto);
    const postCount = await this.categoryService.getPostCountByCategory(category.id);

    return new CategoryResponseDto({
      id: category.id,
      siteId: category.siteId,
      slug: category.slug,
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      postCount: postCount,
    });
  }

  /**
   * DELETE /admin/categories/:id
   * 카테고리 삭제
   */
  @Delete(':id')
  async deleteCategory(
    @CurrentUser() user: UserPrincipal,
    @Param('id') categoryId: string,
  ): Promise<void> {
    const site = await this.siteService.findByUserId(user.userId);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    await this.categoryService.deleteCategory(categoryId, site.id);
  }
}
