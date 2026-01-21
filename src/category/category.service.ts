import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { Post } from '../post/entities/post.entity';

// 예약 slug 목록
const RESERVED_CATEGORY_SLUGS = new Set(['all', 'uncategorized', '미분류']);

// 기본 카테고리 slug
const DEFAULT_CATEGORY_SLUG = 'uncategorized';
const DEFAULT_CATEGORY_NAME = '미분류';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * slug가 예약어인지 확인
   */
  isReservedSlug(slug: string): boolean {
    return RESERVED_CATEGORY_SLUGS.has(slug.toLowerCase());
  }

  /**
   * slug가 사이트 내에서 사용 가능한지 확인
   */
  async isSlugAvailable(
    siteId: string,
    slug: string,
    excludeCategoryId?: string,
  ): Promise<boolean> {
    // 예약어 체크
    if (this.isReservedSlug(slug)) {
      return false;
    }

    const query = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.siteId = :siteId', { siteId })
      .andWhere('category.slug = :slug', { slug: slug.toLowerCase() });

    if (excludeCategoryId) {
      query.andWhere('category.id != :excludeCategoryId', { excludeCategoryId });
    }

    const existing = await query.getOne();
    return !existing;
  }

  /**
   * 기본 카테고리 조회 또는 생성
   */
  async ensureDefaultCategory(siteId: string): Promise<Category> {
    let defaultCategory = await this.categoryRepository.findOne({
      where: { siteId, slug: DEFAULT_CATEGORY_SLUG },
    });

    if (!defaultCategory) {
      defaultCategory = this.categoryRepository.create({
        siteId,
        slug: DEFAULT_CATEGORY_SLUG,
        name: DEFAULT_CATEGORY_NAME,
        description: null,
        sortOrder: 0,
      });
      defaultCategory = await this.categoryRepository.save(defaultCategory);
      this.logger.log(`Created default category for site: ${siteId}`);
    }

    return defaultCategory;
  }

  /**
   * 카테고리 생성
   */
  async createCategory(siteId: string, dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.slug.toLowerCase();

    // 예약어 체크
    if (this.isReservedSlug(slug)) {
      throw BusinessException.fromErrorCode(ErrorCode.CATEGORY_SLUG_RESERVED);
    }

    // slug 중복 체크
    const isAvailable = await this.isSlugAvailable(siteId, slug);
    if (!isAvailable) {
      throw BusinessException.fromErrorCode(ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS);
    }

    // sortOrder가 제공되지 않으면 마지막 순서 + 1
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const lastCategory = await this.categoryRepository.findOne({
        where: { siteId },
        order: { sortOrder: 'DESC' },
      });
      sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;
    }

    const category = this.categoryRepository.create({
      siteId,
      slug,
      name: dto.name,
      description: dto.description || null,
      sortOrder,
    });

    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Created category: ${saved.id} for site: ${siteId}`);
    return saved;
  }

  /**
   * 카테고리 조회 by ID
   */
  async findById(categoryId: string): Promise<Category | null> {
    return this.categoryRepository.findOne({ where: { id: categoryId } });
  }

  /**
   * 사이트의 카테고리 목록 조회
   */
  async findBySiteId(siteId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { siteId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * slug로 카테고리 조회
   */
  async findBySlug(siteId: string, slug: string): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { siteId, slug: slug.toLowerCase() },
    });
  }

  /**
   * 카테고리 수정
   */
  async updateCategory(
    categoryId: string,
    siteId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findById(categoryId);
    if (!category) {
      throw BusinessException.fromErrorCode(ErrorCode.CATEGORY_NOT_FOUND);
    }

    // 다른 사이트의 카테고리는 수정 불가
    if (category.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_FORBIDDEN);
    }

    // 기본 카테고리는 slug 변경 불가
    if (dto.slug && category.slug === DEFAULT_CATEGORY_SLUG) {
      throw BusinessException.fromErrorCode(
        ErrorCode.CATEGORY_SLUG_RESERVED,
        '기본 카테고리의 slug는 변경할 수 없습니다',
      );
    }

    // slug 변경 시 검증
    if (dto.slug) {
      const slug = dto.slug.toLowerCase();
      if (this.isReservedSlug(slug)) {
        throw BusinessException.fromErrorCode(ErrorCode.CATEGORY_SLUG_RESERVED);
      }

      const isAvailable = await this.isSlugAvailable(siteId, slug, categoryId);
      if (!isAvailable) {
        throw BusinessException.fromErrorCode(ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS);
      }

      category.slug = slug;
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }
    if (dto.description !== undefined) {
      category.description = dto.description || null;
    }
    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    const updated = await this.categoryRepository.save(category);
    this.logger.log(`Updated category: ${updated.id}`);
    return updated;
  }

  /**
   * 카테고리 삭제
   */
  async deleteCategory(categoryId: string, siteId: string): Promise<void> {
    const category = await this.findById(categoryId);
    if (!category) {
      throw BusinessException.fromErrorCode(ErrorCode.CATEGORY_NOT_FOUND);
    }

    // 다른 사이트의 카테고리는 삭제 불가
    if (category.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_FORBIDDEN);
    }

    // 기본 카테고리는 삭제 불가
    if (category.slug === DEFAULT_CATEGORY_SLUG) {
      throw BusinessException.fromErrorCode(
        ErrorCode.CATEGORY_SLUG_RESERVED,
        '기본 카테고리는 삭제할 수 없습니다',
      );
    }

    // 게시글이 연결된 카테고리는 삭제 불가
    const postCount = await this.postRepository.count({
      where: { categoryId: categoryId },
    });

    if (postCount > 0) {
      throw BusinessException.fromErrorCode(ErrorCode.CATEGORY_HAS_POSTS);
    }

    await this.categoryRepository.remove(category);
    this.logger.log(`Deleted category: ${categoryId}`);
  }

  /**
   * 카테고리별 게시글 수 조회
   */
  async getPostCountByCategory(categoryId: string): Promise<number> {
    return this.postRepository.count({
      where: { categoryId },
    });
  }

  /**
   * 여러 카테고리의 게시글 수를 한 번에 조회
   */
  async getPostCountsByCategories(categoryIds: string[]): Promise<Map<string, number>> {
    // 빈 배열인 경우 빈 Map 반환 (IN ()는 SQL 문법 오류 발생)
    if (categoryIds.length === 0) {
      return new Map<string, number>();
    }

    const counts = await this.postRepository
      .createQueryBuilder('post')
      .select('post.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('post.categoryId IN (:...categoryIds)', { categoryIds })
      .groupBy('post.categoryId')
      .getRawMany();

    const countMap = new Map<string, number>();
    counts.forEach((item) => {
      countMap.set(item.categoryId, parseInt(item.count, 10));
    });

    // 게시글이 없는 카테고리는 0으로 설정
    categoryIds.forEach((id) => {
      if (!countMap.has(id)) {
        countMap.set(id, 0);
      }
    });

    return countMap;
  }
}
