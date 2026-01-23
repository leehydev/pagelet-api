import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SiteBanner } from './entities/site-banner.entity';
import { SiteService } from '../site/site.service';
import { PostService } from '../post/post.service';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';
import { PostStatus } from '../post/entities/post.entity';
import {
  CreateBannerDto,
  UpdateBannerDto,
  UpdateBannerOrderDto,
  BannerResponseDto,
  BannerPostDto,
  PublicBannerResponseDto,
  PublicBannerPostDto,
} from './dto';

// 배너 관련 상수
const MAX_BANNERS = 5;

@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);

  constructor(
    @InjectRepository(SiteBanner)
    private readonly bannerRepository: Repository<SiteBanner>,
    private readonly siteService: SiteService,
    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,
  ) {}

  /**
   * 배너 생성
   */
  async create(siteId: string, dto: CreateBannerDto): Promise<SiteBanner> {
    // 배너 수 제한 검증
    const existingCount = await this.bannerRepository.count({
      where: { siteId },
    });

    if (existingCount >= MAX_BANNERS) {
      throw BusinessException.fromErrorCode(ErrorCode.BANNER_LIMIT_EXCEEDED);
    }

    // 게시글 검증
    const post = await this.postService.findById(dto.postId);
    if (!post || post.siteId !== siteId) {
      throw BusinessException.fromErrorCode(
        ErrorCode.POST_NOT_FOUND,
        '해당 사이트의 게시글이 아닙니다',
      );
    }

    // PUBLISHED 상태 검증
    if (post.status !== PostStatus.PUBLISHED) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        '발행된 게시글만 배너로 등록할 수 있습니다',
      );
    }

    // 중복 게시글 체크
    const existingBanner = await this.bannerRepository.findOne({
      where: { siteId, postId: dto.postId },
    });
    if (existingBanner) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        '이미 등록된 게시글입니다',
      );
    }

    // displayOrder가 제공되지 않으면 마지막 순서 + 1
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined) {
      const lastBanner = await this.bannerRepository.findOne({
        where: { siteId },
        order: { displayOrder: 'DESC' },
      });
      displayOrder = lastBanner ? lastBanner.displayOrder + 1 : 0;
    }

    const banner = this.bannerRepository.create({
      siteId,
      postId: dto.postId,
      isActive: dto.isActive ?? true,
      startAt: dto.startAt ? new Date(dto.startAt) : null,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
      displayOrder,
    });

    const saved = await this.bannerRepository.save(banner);
    this.logger.log(`Created banner: ${saved.id} for site: ${siteId}`);
    return saved;
  }

  /**
   * 사이트의 배너 목록 조회 (Admin용)
   */
  async findBySiteId(siteId: string): Promise<SiteBanner[]> {
    return this.bannerRepository.find({
      where: { siteId },
      relations: ['post', 'post.category'],
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * 배너 ID로 조회
   */
  async findById(bannerId: string): Promise<SiteBanner | null> {
    return this.bannerRepository.findOne({
      where: { id: bannerId },
      relations: ['post', 'post.category'],
    });
  }

  /**
   * 배너 수정
   */
  async update(bannerId: string, siteId: string, dto: UpdateBannerDto): Promise<SiteBanner> {
    const banner = await this.findById(bannerId);
    if (!banner) {
      throw BusinessException.fromErrorCode(ErrorCode.BANNER_NOT_FOUND);
    }

    // 다른 사이트의 배너는 수정 불가
    if (banner.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_FORBIDDEN);
    }

    // postId 변경 시 검증
    if (dto.postId !== undefined && dto.postId !== banner.postId) {
      const post = await this.postService.findById(dto.postId);
      if (!post || post.siteId !== siteId) {
        throw BusinessException.fromErrorCode(
          ErrorCode.POST_NOT_FOUND,
          '해당 사이트의 게시글이 아닙니다',
        );
      }

      if (post.status !== PostStatus.PUBLISHED) {
        throw BusinessException.fromErrorCode(
          ErrorCode.COMMON_BAD_REQUEST,
          '발행된 게시글만 배너로 등록할 수 있습니다',
        );
      }

      // 중복 게시글 체크
      const existingBanner = await this.bannerRepository.findOne({
        where: { siteId, postId: dto.postId },
      });
      if (existingBanner && existingBanner.id !== bannerId) {
        throw BusinessException.fromErrorCode(
          ErrorCode.COMMON_BAD_REQUEST,
          '이미 등록된 게시글입니다',
        );
      }

      banner.postId = dto.postId;
    }

    // 필드별 업데이트
    if (dto.isActive !== undefined) banner.isActive = dto.isActive;
    if (dto.startAt !== undefined) banner.startAt = dto.startAt ? new Date(dto.startAt) : null;
    if (dto.endAt !== undefined) banner.endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (dto.displayOrder !== undefined) banner.displayOrder = dto.displayOrder;

    const updated = await this.bannerRepository.save(banner);
    this.logger.log(`Updated banner: ${updated.id}`);

    // 업데이트된 배너를 post와 함께 다시 조회
    return this.findById(updated.id) as Promise<SiteBanner>;
  }

  /**
   * 배너 삭제
   */
  async delete(bannerId: string, siteId: string): Promise<void> {
    const banner = await this.bannerRepository.findOne({ where: { id: bannerId } });
    if (!banner) {
      throw BusinessException.fromErrorCode(ErrorCode.BANNER_NOT_FOUND);
    }

    // 다른 사이트의 배너는 삭제 불가
    if (banner.siteId !== siteId) {
      throw BusinessException.fromErrorCode(ErrorCode.COMMON_FORBIDDEN);
    }

    await this.bannerRepository.remove(banner);
    this.logger.log(`Deleted banner: ${bannerId}`);
  }

  /**
   * 배너 순서 변경
   */
  async updateOrder(siteId: string, dto: UpdateBannerOrderDto): Promise<SiteBanner[]> {
    const { bannerIds } = dto;

    // 해당 사이트의 배너 조회
    const banners = await this.bannerRepository.find({
      where: { siteId, id: In(bannerIds) },
    });

    // 모든 배너가 존재하는지 검증
    if (banners.length !== bannerIds.length) {
      throw BusinessException.fromErrorCode(
        ErrorCode.BANNER_NOT_FOUND,
        '일부 배너를 찾을 수 없습니다',
      );
    }

    // 순서 업데이트
    const bannerMap = new Map(banners.map((b) => [b.id, b]));
    const updatedBanners: SiteBanner[] = [];

    for (let i = 0; i < bannerIds.length; i++) {
      const banner = bannerMap.get(bannerIds[i]);
      if (banner) {
        banner.displayOrder = i;
        updatedBanners.push(banner);
      }
    }

    await this.bannerRepository.save(updatedBanners);
    this.logger.log(`Updated banner order for site: ${siteId}`);

    return this.findBySiteId(siteId);
  }

  /**
   * 공개 배너 조회 (Public API용)
   * - isActive가 true
   * - 현재 시간이 startAt ~ endAt 범위 내
   * - 게시글이 PUBLISHED 상태
   */
  async findActiveBySlug(siteSlug: string): Promise<SiteBanner[]> {
    // siteSlug로 사이트 조회
    const site = await this.siteService.findBySlug(siteSlug);
    if (!site) {
      throw BusinessException.fromErrorCode(ErrorCode.SITE_NOT_FOUND);
    }

    const now = new Date();

    // QueryBuilder를 사용하여 복잡한 조건 처리
    const banners = await this.bannerRepository
      .createQueryBuilder('banner')
      .leftJoinAndSelect('banner.post', 'post')
      .leftJoinAndSelect('post.category', 'category')
      .where('banner.siteId = :siteId', { siteId: site.id })
      .andWhere('banner.isActive = :isActive', { isActive: true })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('(banner.startAt IS NULL OR banner.startAt <= :now)', { now })
      .andWhere('(banner.endAt IS NULL OR banner.endAt >= :now)', { now })
      .orderBy('banner.displayOrder', 'ASC')
      .addOrderBy('banner.createdAt', 'ASC')
      .getMany();

    return banners;
  }

  /**
   * Entity를 BannerResponseDto로 변환
   */
  toBannerResponse(banner: SiteBanner): BannerResponseDto {
    return new BannerResponseDto({
      id: banner.id,
      postId: banner.postId,
      post: new BannerPostDto({
        id: banner.post.id,
        title: banner.post.title,
        subtitle: banner.post.subtitle,
        slug: banner.post.slug,
        ogImageUrl: banner.post.ogImageUrl,
        categoryId: banner.post.categoryId,
        categoryName: banner.post.category?.name || null,
        publishedAt: banner.post.publishedAt,
      }),
      isActive: banner.isActive,
      startAt: banner.startAt,
      endAt: banner.endAt,
      displayOrder: banner.displayOrder,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    });
  }

  /**
   * Entity를 PublicBannerResponseDto로 변환
   */
  toPublicBannerResponse(banner: SiteBanner): PublicBannerResponseDto {
    return new PublicBannerResponseDto({
      id: banner.id,
      post: new PublicBannerPostDto({
        title: banner.post.title,
        subtitle: banner.post.subtitle,
        slug: banner.post.slug,
        ogImageUrl: banner.post.ogImageUrl,
        categoryName: banner.post.category?.name || null,
        publishedAt: banner.post.publishedAt,
      }),
      displayOrder: banner.displayOrder,
    });
  }
}
