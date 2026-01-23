import { Controller, Get, Post, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminGuard } from './guards/superadmin.guard';
import { WaitlistUserResponseDto } from './dto/waitlist-user-response.dto';

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
}
