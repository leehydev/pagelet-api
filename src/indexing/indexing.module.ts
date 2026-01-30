import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Post } from '../post/entities/post.entity';
import { SiteModule } from '../site/site.module';
import { IndexingService } from './indexing.service';
import { AdminIndexingController } from './admin-indexing.controller';
import { PublicIndexingController } from './public-indexing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), SiteModule],
  controllers: [AdminIndexingController, PublicIndexingController],
  providers: [IndexingService],
  exports: [IndexingService],
})
export class IndexingModule {}
