import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { SuperAdminService } from './superadmin.service';
import { SuperAdminGuard } from './guards/superadmin.guard';
import { IndexingService } from '../indexing/indexing.service';
import { WaitlistUserResponseDto } from './dto/waitlist-user-response.dto';
import { SystemSettingResponseDto } from './dto/system-setting-response.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { ReservedSlugResponseDto } from './dto/reserved-slug-response.dto';
import { CreateReservedSlugDto } from './dto/create-reserved-slug.dto';
import { SetUserAdminDto } from './dto/set-user-admin.dto';

/**
 * 슈퍼 관리자 API
 * 환경변수 SUPERADMIN_USER_IDS에 지정된 사용자만 접근 가능
 */
@ApiTags('SuperAdmin')
@Controller('superadmin')
@UseGuards(SuperAdminGuard)
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly indexingService: IndexingService,
  ) {}

  /**
   * 대기자 목록 조회
   */
  @Get('waitlist')
  async getWaitlist(): Promise<WaitlistUserResponseDto[]> {
    return this.superAdminService.getWaitlist();
  }

  /**
   * 대기자 승인
   */
  @Post('waitlist/:userId/approve')
  async approveUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<void> {
    return this.superAdminService.approveUser(userId);
  }

  /**
   * 시스템 설정 조회
   */
  @Get('settings/:key')
  async getSetting(@Param('key') key: string): Promise<SystemSettingResponseDto> {
    return this.superAdminService.getSetting(key);
  }

  /**
   * 시스템 설정 변경
   */
  @Put('settings/:key')
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSystemSettingDto,
  ): Promise<SystemSettingResponseDto> {
    return this.superAdminService.updateSetting(key, dto.value);
  }

  /**
   * 예약어 슬러그 목록 조회
   */
  @Get('reserved-slugs')
  async getReservedSlugs(): Promise<ReservedSlugResponseDto[]> {
    return this.superAdminService.getReservedSlugs();
  }

  /**
   * 예약어 슬러그 추가
   */
  @Post('reserved-slugs')
  async createReservedSlug(@Body() dto: CreateReservedSlugDto): Promise<ReservedSlugResponseDto> {
    return this.superAdminService.createReservedSlug(dto);
  }

  /**
   * 예약어 슬러그 삭제
   */
  @Delete('reserved-slugs/:slugId')
  async deleteReservedSlug(@Param('slugId', ParseUUIDPipe) slugId: string): Promise<void> {
    return this.superAdminService.deleteReservedSlug(slugId);
  }

  /**
   * 사용자 어드민 권한 설정
   */
  @Put('users/:userId/admin')
  async setUserAdmin(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SetUserAdminDto,
  ): Promise<void> {
    return this.superAdminService.setUserAdmin(userId, dto.isAdmin);
  }

  /**
   * 발행된 포스트 Google 색인 수동 트리거
   * Cron(매일 03:00)과 동일한 로직을 즉시 실행
   */
  @Post('indexing/index-published-posts')
  @ApiOperation({ summary: '발행된 포스트 Google 색인 수동 실행' })
  async indexPublishedPosts(): Promise<void> {
    return this.indexingService.indexPublishedPosts();
  }
}
