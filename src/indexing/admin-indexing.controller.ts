import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { AdminSiteHeaderGuard } from '../auth/guards/admin-site-header.guard';
import { CurrentSite } from '../auth/decorators/current-site.decorator';
import { Site } from '../site/entities/site.entity';
import { IndexingService } from './indexing.service';
import { RequestIndexingDto } from './dto/request-indexing.dto';
import { IndexingResponseDto } from './dto/indexing-response.dto';

@ApiTags('Admin Indexing')
@Controller('admin/indexing')
@UseGuards(AdminSiteHeaderGuard)
export class AdminIndexingController {
  constructor(private readonly indexingService: IndexingService) {}

  @Post('request')
  @ApiOperation({ summary: 'Google에 URL 색인 요청' })
  async requestIndexing(
    @CurrentSite() _site: Site,
    @Body() dto: RequestIndexingDto,
  ): Promise<IndexingResponseDto> {
    return this.indexingService.requestIndexing(dto.url);
  }
}
