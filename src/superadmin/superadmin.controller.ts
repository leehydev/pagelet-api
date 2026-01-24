import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminGuard } from './guards/superadmin.guard';
import { WaitlistUserResponseDto } from './dto/waitlist-user-response.dto';
import { SystemSettingResponseDto } from './dto/system-setting-response.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';

/**
 * 슈퍼 관리자 API
 * 환경변수 SUPERADMIN_USER_IDS에 지정된 사용자만 접근 가능
 */
@Controller('superadmin')
@UseGuards(SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

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
}
