import { Controller, Get, Query } from '@nestjs/common';
import { BannerService } from './banner.service';
import { PublicBannerResponseDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@Controller('public/banners')
@Public()
export class PublicBannerController {
  constructor(private readonly bannerService: BannerService) {}

  /**
   * GET /public/banners?siteSlug=xxx&deviceType=desktop
   * 공개 배너 조회 (활성 상태 + 기간 내 배너만)
   */
  @Get()
  async getActiveBanners(
    @Query('siteSlug') siteSlug: string,
    @Query('deviceType') deviceType: string,
  ): Promise<PublicBannerResponseDto[]> {
    if (!siteSlug) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'siteSlug query parameter is required',
      );
    }

    if (!deviceType) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'deviceType query parameter is required',
      );
    }

    if (!['desktop', 'mobile'].includes(deviceType)) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'deviceType must be desktop or mobile',
      );
    }

    const banners = await this.bannerService.findActiveBySlug(siteSlug, deviceType);
    return banners.map((banner) => this.bannerService.toPublicBannerResponse(banner));
  }
}
