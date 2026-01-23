import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { PublicCategoryResponseDto } from './dto';
import { SiteService } from '../site/site.service';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { Public } from '../auth/decorators/public.decorator';
import { PostStatus } from '../post/entities/post.entity';

@Controller('public/categories')
@Public()
export class PublicCategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly siteService: SiteService,
  ) {}

  /**
   * GET /public/categories?siteSlug=xxx
   * 공개 카테고리 목록 조회
   */
  @Get()
  async getPublicCategories(
    @Query('siteSlug') siteSlug: string,
  ): Promise<PublicCategoryResponseDto[]> {
    if (!siteSlug) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'siteSlug query parameter is required',
      );
    }

    const site = await this.siteService.findBySlug(siteSlug);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const categories = await this.categoryService.findBySiteId(site.id);
    const categoryIds = categories.map((c) => c.id);
    const postCounts = await this.categoryService.getPostCountsByCategories(
      categoryIds,
      PostStatus.PUBLISHED,
    );

    return categories.map(
      (category) =>
        new PublicCategoryResponseDto({
          slug: category.slug,
          name: category.name,
          description: category.description,
          postCount: postCounts.get(category.id) || 0,
        }),
    );
  }
}
