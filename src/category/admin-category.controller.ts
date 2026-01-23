import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { AdminSiteGuard } from '../auth/guards/admin-site.guard';
import { Site } from '../site/entities/site.entity';

@Controller('admin/sites/:siteId/categories')
@UseGuards(AdminSiteGuard)
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /admin/sites/:siteId/categories
   * 카테고리 목록 조회
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
   * POST /admin/sites/:siteId/categories
   * 카테고리 생성
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
   * PUT /admin/sites/:siteId/categories/:id
   * 카테고리 수정
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
   * DELETE /admin/sites/:siteId/categories/:id
   * 카테고리 삭제
   */
  @Delete(':id')
  async deleteCategory(@CurrentSite() site: Site, @Param('id') categoryId: string): Promise<void> {
    await this.categoryService.deleteCategory(categoryId, site.id);
  }
}
