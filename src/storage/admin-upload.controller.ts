import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { AbortUploadDto } from './dto/abort-upload.dto';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { AdminSiteGuard } from '../auth/guards/admin-site.guard';
import { Site } from '../site/entities/site.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('admin/sites/:siteId/uploads')
@UseGuards(AdminSiteGuard)
export class AdminUploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /admin/sites/:siteId/uploads/presign
   * Presigned URL 생성 및 용량 예약
   */
  @Post('presign')
  @ApiOperation({ summary: 'Presigned URL 생성' })
  @ApiResponse({ status: 200, description: 'Presigned URL 생성 성공' })
  @ApiResponse({ status: 400, description: '용량 초과 또는 잘못된 요청' })
  async presign(@CurrentSite() site: Site, @Body() dto: PresignUploadDto) {
    return this.uploadService.presignUpload(site.id, dto);
  }

  /**
   * POST /admin/sites/:siteId/uploads/complete
   * 업로드 완료 확정
   */
  @Post('complete')
  @ApiOperation({ summary: '업로드 완료 확정' })
  @ApiResponse({ status: 200, description: '업로드 완료 확정 성공' })
  @ApiResponse({ status: 404, description: '업로드 정보를 찾을 수 없음' })
  async complete(@CurrentSite() site: Site, @Body() dto: CompleteUploadDto) {
    return this.uploadService.completeUpload(site.id, dto);
  }

  /**
   * POST /admin/sites/:siteId/uploads/abort
   * 업로드 중단
   */
  @Post('abort')
  @ApiOperation({ summary: '업로드 중단' })
  @ApiResponse({ status: 200, description: '업로드 중단 성공' })
  async abort(@CurrentSite() site: Site, @Body() dto: AbortUploadDto) {
    return this.uploadService.abortUpload(site.id, dto.s3Key);
  }
}
