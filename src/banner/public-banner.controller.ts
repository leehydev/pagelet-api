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
   * GET /public/banners?siteSlug=xxx
   * 공개 배너 조회 (활성 상태 + 기간 내 + PUBLISHED 게시글만)
   */
  @Get()
  async getActiveBanners(
    @Query('siteSlug') siteSlug: string,
  ): Promise<PublicBannerResponseDto[]> {
    if (!siteSlug) {
      throw BusinessException.fromErrorCode(
        ErrorCode.COMMON_BAD_REQUEST,
        'siteSlug query parameter is required',
      );
    }

    const banners = await this.bannerService.findActiveBySlug(siteSlug);
    return banners.map((banner) => this.bannerService.toPublicBannerResponse(banner));
  }
}
