import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import {
  BannerPresignDto,
  BannerPresignResponseDto,
  CreateBannerDto,
  UpdateBannerDto,
  UpdateBannerOrderDto,
  BannerResponseDto,
} from './dto';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { AdminSiteGuard } from '../auth/guards/admin-site.guard';
import { Site } from '../site/entities/site.entity';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@Controller('admin/sites/:siteId/banners')
@UseGuards(AdminSiteGuard)
export class AdminBannerController {
  constructor(private readonly bannerService: BannerService) {}

  /**
   * POST /admin/sites/:siteId/banners/presign
   * 배너 이미지 업로드 URL 발급
   */
  @Post('presign')
  async presign(
    @CurrentSite() site: Site,
    @Body() dto: BannerPresignDto,
  ): Promise<BannerPresignResponseDto> {
    return this.bannerService.presign(site.id, dto);
  }

  /**
   * POST /admin/sites/:siteId/banners
   * 배너 생성
   */
  @Post()
  async createBanner(
    @CurrentSite() site: Site,
    @Body() dto: CreateBannerDto,
  ): Promise<BannerResponseDto> {
    const banner = await this.bannerService.create(site.id, dto);
    return this.bannerService.toBannerResponse(banner);
  }

  /**
   * GET /admin/sites/:siteId/banners
   * 배너 목록 조회 (deviceType 쿼리 파라미터로 필터링)
   */
  @Get()
  async getBanners(
    @CurrentSite() site: Site,
    @Query('deviceType') deviceType?: string,
  ): Promise<BannerResponseDto[]> {
    const banners = await this.bannerService.findBySiteId(site.id, deviceType);
    return banners.map((banner) => this.bannerService.toBannerResponse(banner));
  }

  /**
   * GET /admin/sites/:siteId/banners/:id
   * 배너 상세 조회
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
   * PUT /admin/sites/:siteId/banners/:id
   * 배너 수정
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
   * DELETE /admin/sites/:siteId/banners/:id
   * 배너 삭제
   */
  @Delete(':id')
  async deleteBanner(@CurrentSite() site: Site, @Param('id') bannerId: string): Promise<void> {
    await this.bannerService.delete(bannerId, site.id);
  }

  /**
   * PUT /admin/sites/:siteId/banners/order
   * 배너 순서 변경
   */
  @Put('order')
  async updateOrder(
    @CurrentSite() site: Site,
    @Body() dto: UpdateBannerOrderDto,
  ): Promise<BannerResponseDto[]> {
    const banners = await this.bannerService.updateOrder(site.id, dto);
    return banners.map((banner) => this.bannerService.toBannerResponse(banner));
  }
}
