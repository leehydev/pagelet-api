import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { AdminSiteHeaderGuard } from '../auth/guards/admin-site-header.guard';
import { Site } from '../site/entities/site.entity';

/**
 * AdminCategoryV2Controller
 * X-Site-Id 헤더 기반 인증을 사용하는 PoC 컨트롤러
 * URL에서 siteId가 제거되고 헤더로 전달됨
 */
@Controller('admin/v2/categories')
@UseGuards(AdminSiteHeaderGuard)
export class AdminCategoryV2Controller {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /admin/v2/categories
   * 카테고리 목록 조회
   * Header: X-Site-Id: {siteId}
   */
  @Get()
  async getCategories(@CurrentSite() site: Site): Promise<CategoryResponseDto[]> {
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
   * POST /admin/v2/categories
   * 카테고리 생성
   * Header: X-Site-Id: {siteId}
   */
  @Post()
  async createCategory(
    @CurrentSite() site: Site,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
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
   * PUT /admin/v2/categories/:id
   * 카테고리 수정
   * Header: X-Site-Id: {siteId}
   */
  @Put(':id')
  async updateCategory(
    @CurrentSite() site: Site,
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
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
   * DELETE /admin/v2/categories/:id
   * 카테고리 삭제
   * Header: X-Site-Id: {siteId}
   */
  @Delete(':id')
  async deleteCategory(@CurrentSite() site: Site, @Param('id') categoryId: string): Promise<void> {
    await this.categoryService.deleteCategory(categoryId, site.id);
  }
}
