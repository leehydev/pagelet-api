import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { SuperAdminService } from '../superadmin.service';
import { SuperAdminGuard } from '../guards/superadmin.guard';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';
import { RecentSiteResponseDto } from '../dto/recent-site-response.dto';
import { StorageSummaryResponseDto } from '../dto/storage-summary-response.dto';

/**
 * 슈퍼 관리자 대시보드 API
 */
@ApiTags('SuperAdmin - Dashboard')
@Controller('superadmin')
@UseGuards(SuperAdminGuard)
export class SuperAdminDashboardController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  /**
   * 대시보드 통합 조회
   */
  @Get('dashboard')
  @ApiOperation({ summary: '대시보드 통합 데이터 조회' })
  async getDashboard(): Promise<DashboardResponseDto> {
    return this.superAdminService.getDashboard();
  }

  /**
   * 최근 생성된 사이트 목록 조회
   */
  @Get('sites/recent')
  @ApiOperation({ summary: '최근 생성된 사이트 목록 조회' })
  async getRecentSites(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<RecentSiteResponseDto[]> {
    return this.superAdminService.getRecentSites(limit);
  }

  /**
   * 스토리지 요약 조회
   */
  @Get('storage/summary')
  @ApiOperation({ summary: '전체 스토리지 사용량 조회' })
  async getStorageSummary(): Promise<StorageSummaryResponseDto> {
    return this.superAdminService.getStorageSummary();
  }
}
