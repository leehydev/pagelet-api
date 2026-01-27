import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';
import { AdminCategoryController } from './admin-category.controller';
import { AdminCategoryV2Controller } from './admin-category-v2.controller';
import { PublicCategoryController } from './public-category.controller';
import { Post } from '../post/entities/post.entity';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Post]), forwardRef(() => SiteModule)],
  controllers: [AdminCategoryController, AdminCategoryV2Controller, PublicCategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
