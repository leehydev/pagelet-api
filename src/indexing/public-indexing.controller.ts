import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { IndexingService } from './indexing.service';

// TODO: 테스트 후 삭제
@ApiTags('Public Indexing')
@Controller('public/indexing')
@Public()
export class PublicIndexingController {
  constructor(private readonly indexingService: IndexingService) {}

  @Post('batch')
  @ApiOperation({ summary: '전체 공개 게시글 일괄 색인 (테스트용)' })
  async batchIndexing(): Promise<{ message: string }> {
    await this.indexingService.indexPublishedPosts();
    return { message: 'Batch indexing completed' };
  }
}
