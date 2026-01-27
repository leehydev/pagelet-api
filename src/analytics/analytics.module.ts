import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicAnalyticsController } from './public-analytics.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsV2Controller } from './admin-analytics-v2.controller';
import { AnalyticsService } from './analytics.service';
import { PageView } from './entities/page-view.entity';
import { CtaClick } from './entities/cta-click.entity';
import { Post } from '../post/entities/post.entity';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [TypeOrmModule.forFeature([PageView, CtaClick, Post]), SiteModule],
  controllers: [PublicAnalyticsController, AdminAnalyticsController, AdminAnalyticsV2Controller],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
