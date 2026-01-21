import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingPostController } from './onboarding-post.controller';
import { AdminPostController } from './admin-post.controller';
import { PublicPostController } from './public-post.controller';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { SiteModule } from '../site/site.module';
import { StorageModule } from '../storage/storage.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    SiteModule,
    StorageModule,
    forwardRef(() => CategoryModule),
  ],
  controllers: [OnboardingPostController, AdminPostController, PublicPostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
