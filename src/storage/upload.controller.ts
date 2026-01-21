import { Controller, Post, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { AbortUploadDto } from './dto/abort-upload.dto';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { SiteGuard } from '../auth/guards/site.guard';
import { Site } from '../site/entities/site.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('uploads')
@UseGuards(SiteGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /uploads/presign
   * Presigned URL 생성 및 용량 예약
   */
  @Post('presign')
  @ApiOperation({ summary: 'Presigned URL 생성' })
  @ApiResponse({ status: 200, description: 'Presigned URL 생성 성공' })
  @ApiResponse({ status: 400, description: '용량 초과 또는 잘못된 요청' })
  async presign(@CurrentSite() site: Site | null, @Body() dto: PresignUploadDto) {
    if (!site) {
      throw new NotFoundException('사이트가 존재하지 않습니다. 먼저 사이트를 생성해주세요.');
    }

    return this.uploadService.presignUpload(site.id, dto);
  }

  /**
   * POST /uploads/complete
   * 업로드 완료 확정
   */
  @Post('complete')
  @ApiOperation({ summary: '업로드 완료 확정' })
  @ApiResponse({ status: 200, description: '업로드 완료 확정 성공' })
  @ApiResponse({ status: 404, description: '업로드 정보를 찾을 수 없음' })
  async complete(@CurrentSite() site: Site | null, @Body() dto: CompleteUploadDto) {
    if (!site) {
      throw new NotFoundException('사이트가 존재하지 않습니다. 먼저 사이트를 생성해주세요.');
    }

    return this.uploadService.completeUpload(site.id, dto);
  }

  /**
   * POST /uploads/abort
   * 업로드 중단
   */
  @Post('abort')
  @ApiOperation({ summary: '업로드 중단' })
  @ApiResponse({ status: 200, description: '업로드 중단 성공' })
  async abort(@CurrentSite() site: Site | null, @Body() dto: AbortUploadDto) {
    if (!site) {
      throw new NotFoundException('사이트가 존재하지 않습니다. 먼저 사이트를 생성해주세요.');
    }

    return this.uploadService.abortUpload(site.id, dto.s3Key);
  }
}
