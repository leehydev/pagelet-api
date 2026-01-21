import { Controller, Post, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { BrandingAssetService } from './branding-asset.service';
import { BrandingPresignDto } from './dto/branding-presign.dto';
import { BrandingCommitDto } from './dto/branding-commit.dto';
import { BrandingPresignResponseDto, BrandingCommitResponseDto } from './dto/branding-response.dto';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Site } from '../site/entities/site.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Branding Assets')
@Controller('admin/assets/branding')
@UseGuards(TenantGuard)
export class BrandingAssetController {
  constructor(private readonly brandingAssetService: BrandingAssetService) {}

  /**
   * POST /admin/assets/branding/presign
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
    @CurrentTenant() tenant: Site | null,
    @Body() dto: BrandingPresignDto,
  ): Promise<BrandingPresignResponseDto> {
    if (!tenant) {
      throw new NotFoundException('사이트가 존재하지 않습니다. 먼저 사이트를 생성해주세요.');
    }

    return this.brandingAssetService.presign(tenant.id, dto);
  }

  /**
   * POST /admin/assets/branding/commit
   * 브랜딩 에셋 업로드 확정 (tmp → 최종 경로)
   */
  @Post('commit')
  @ApiOperation({ summary: '브랜딩 에셋 업로드 확정' })
  @ApiResponse({ status: 200, description: '업로드 확정 성공', type: BrandingCommitResponseDto })
  @ApiResponse({ status: 404, description: '임시 파일을 찾을 수 없음' })
  async commit(
    @CurrentTenant() tenant: Site | null,
    @Body() dto: BrandingCommitDto,
  ): Promise<BrandingCommitResponseDto> {
    if (!tenant) {
      throw new NotFoundException('사이트가 존재하지 않습니다. 먼저 사이트를 생성해주세요.');
    }

    return this.brandingAssetService.commit(tenant.id, dto);
  }
}
