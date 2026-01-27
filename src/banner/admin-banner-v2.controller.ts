import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto, UpdateBannerDto, UpdateBannerOrderDto, BannerResponseDto } from './dto';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { AdminSiteHeaderGuard } from '../auth/guards/admin-site-header.guard';
import { Site } from '../site/entities/site.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

/**
 * AdminBannerV2Controller
 * X-Site-Id 헤더 기반 인증을 사용하는 v2 컨트롤러
 * URL에서 siteId가 제거되고 헤더로 전달됨
 */
@Controller('admin/v2/banners')
@UseGuards(AdminSiteHeaderGuard)
export class AdminBannerV2Controller {
  constructor(private readonly bannerService: BannerService) {}

  /**
   * POST /admin/v2/banners
   * 배너 생성 (postId 필수)
   * Header: X-Site-Id: {siteId}
   */
  @Post()
  async createBanner(
    @CurrentSite() site: Site,
    @Body() dto: CreateBannerDto,
  ): Promise<BannerResponseDto> {
    const banner = await this.bannerService.create(site.id, dto);
    const bannerWithPost = await this.bannerService.findById(banner.id);
    return this.bannerService.toBannerResponse(bannerWithPost!);
  }

  /**
   * GET /admin/v2/banners
   * 배너 목록 조회
   * Header: X-Site-Id: {siteId}
   */
  @Get()
  async getBanners(@CurrentSite() site: Site): Promise<BannerResponseDto[]> {
    const banners = await this.bannerService.findBySiteId(site.id);
    return banners.map((banner) => this.bannerService.toBannerResponse(banner));
  }

  /**
   * PUT /admin/v2/banners/order
   * 배너 순서 변경
   * Header: X-Site-Id: {siteId}
   */
  @Put('order')
  async updateOrder(
    @CurrentSite() site: Site,
    @Body() dto: UpdateBannerOrderDto,
  ): Promise<BannerResponseDto[]> {
    const banners = await this.bannerService.updateOrder(site.id, dto);
    return banners.map((banner) => this.bannerService.toBannerResponse(banner));
  }

  /**
   * GET /admin/v2/banners/:id
   * 배너 상세 조회
   * Header: X-Site-Id: {siteId}
   */
  @Get(':id')
  async getBanner(
    @CurrentSite() site: Site,
    @Param('id') bannerId: string,
  ): Promise<BannerResponseDto> {
    const banner = await this.bannerService.findById(bannerId);
    if (!banner || banner.siteId !== site.id) {
      throw BusinessException.fromErrorCode(ErrorCode.BANNER_NOT_FOUND);
    }
    return this.bannerService.toBannerResponse(banner);
  }

  /**
   * PUT /admin/v2/banners/:id
   * 배너 수정
   * Header: X-Site-Id: {siteId}
   */
  @Put(':id')
  async updateBanner(
    @CurrentSite() site: Site,
    @Param('id') bannerId: string,
    @Body() dto: UpdateBannerDto,
  ): Promise<BannerResponseDto> {
    const banner = await this.bannerService.update(bannerId, site.id, dto);
    return this.bannerService.toBannerResponse(banner);
  }

  /**
   * DELETE /admin/v2/banners/:id
   * 배너 삭제
   * Header: X-Site-Id: {siteId}
   */
  @Delete(':id')
  async deleteBanner(@CurrentSite() site: Site, @Param('id') bannerId: string): Promise<void> {
    await this.bannerService.delete(bannerId, site.id);
  }
}
