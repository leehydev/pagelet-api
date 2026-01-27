import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingPostController } from './onboarding-post.controller';
import { AdminPostController } from './admin-post.controller';
import { AdminPostV2Controller } from './admin-post-v2.controller';
import { PublicPostController } from './public-post.controller';
import { PostService } from './post.service';
import { PostDraftService } from './post-draft.service';
import { Post } from './entities/post.entity';
import { PostDraft } from './entities/post-draft.entity';
import { SiteModule } from '../site/site.module';
import { StorageModule } from '../storage/storage.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostDraft]),
    SiteModule,
    StorageModule,
    forwardRef(() => CategoryModule),
  ],
  controllers: [
    OnboardingPostController,
    AdminPostController,
    AdminPostV2Controller,
    PublicPostController,
  ],
  providers: [PostService, PostDraftService],
  exports: [PostService, PostDraftService],
})
export class PostModule {}
