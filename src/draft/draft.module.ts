import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Draft } from './entities/draft.entity';
import { DraftImage } from './entities/draft-image.entity';
import { DraftService } from './draft.service';
import { DraftImageService } from './draft-image.service';
import { AdminDraftV2Controller } from './admin-draft-v2.controller';
import { PostModule } from '../post/post.module';
import { StorageModule } from '../storage/storage.module';
import { SiteModule } from '../site/site.module';
import { PostImage } from '../storage/entities/post-image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Draft, DraftImage, PostImage]),
    forwardRef(() => PostModule),
    forwardRef(() => StorageModule),
    forwardRef(() => SiteModule),
  ],
  controllers: [AdminDraftV2Controller],
  providers: [DraftService, DraftImageService],
  exports: [DraftService, DraftImageService],
})
export class DraftModule {}
