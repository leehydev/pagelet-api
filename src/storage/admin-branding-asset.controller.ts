import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BrandingAssetService } from './branding-asset.service';
import { BrandingPresignDto, BrandingType } from './dto/branding-presign.dto';
import { BrandingCommitDto } from './dto/branding-commit.dto';
import { BrandingPresignResponseDto, BrandingCommitResponseDto } from './dto/branding-response.dto';
import { BrandingDeleteResponseDto } from './dto/branding-delete.dto';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { AdminSiteGuard } from '../auth/guards/admin-site.guard';
import { Site } from '../site/entities/site.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

@ApiTags('Branding Assets')
@Controller('admin/sites/:siteId/assets/branding')
@UseGuards(AdminSiteGuard)
export class AdminBrandingAssetController {
  constructor(private readonly brandingAssetService: BrandingAssetService) {}

  /**
   * POST /admin/sites/:siteId/assets/branding/presign
   * 브랜딩 에셋 Presigned URL 생성
   */
  @Post('presign')
  @ApiOperation({ summary: '브랜딩 에셋 Presigned URL 생성' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL 생성 성공',
    type: BrandingPresignResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (파일 형식/크기)' })
  async presign(
    @CurrentSite() site: Site,
    @Body() dto: BrandingPresignDto,
  ): Promise<BrandingPresignResponseDto> {
    return this.brandingAssetService.presign(site.id, dto);
  }

  /**
   * POST /admin/sites/:siteId/assets/branding/commit
   * 브랜딩 에셋 업로드 확정 (tmp → 최종 경로)
   */
  @Post('commit')
  @ApiOperation({ summary: '브랜딩 에셋 업로드 확정' })
  @ApiResponse({ status: 200, description: '업로드 확정 성공', type: BrandingCommitResponseDto })
  @ApiResponse({ status: 404, description: '임시 파일을 찾을 수 없음' })
  async commit(
    @CurrentSite() site: Site,
    @Body() dto: BrandingCommitDto,
  ): Promise<BrandingCommitResponseDto> {
    return this.brandingAssetService.commit(site.id, dto);
  }

  /**
   * DELETE /admin/sites/:siteId/assets/branding/:type
   * 브랜딩 에셋 삭제 (S3 파일 삭제 + Site 필드 null 처리)
   */
  @Delete(':type')
  @ApiOperation({ summary: '브랜딩 에셋 삭제' })
  @ApiParam({
    name: 'type',
    description: '브랜딩 타입',
    enum: ['logo', 'favicon', 'og', 'cta'],
    example: 'logo',
  })
  @ApiResponse({ status: 200, description: '삭제 성공', type: BrandingDeleteResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 브랜딩 타입' })
  @ApiResponse({ status: 404, description: '삭제할 이미지가 없음' })
  async delete(
    @CurrentSite() site: Site,
    @Param('type') type: string,
  ): Promise<BrandingDeleteResponseDto> {
    // type 파라미터 검증
    if (!this.isValidBrandingType(type)) {
      throw BusinessException.withMessage(
        ErrorCode.COMMON_BAD_REQUEST,
        `유효하지 않은 브랜딩 타입입니다. logo, favicon, og, cta 중 하나를 선택해주세요`,
      );
    }

    return this.brandingAssetService.delete(site.id, type);
  }

  /**
   * 유효한 브랜딩 타입인지 확인
   */
  private isValidBrandingType(type: string): type is BrandingType {
    return Object.values(BrandingType).includes(type as BrandingType);
  }
}
