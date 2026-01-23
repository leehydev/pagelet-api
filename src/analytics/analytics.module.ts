import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicAnalyticsController } from './public-analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PageView } from './entities/page-view.entity';
import { CtaClick } from './entities/cta-click.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PageView, CtaClick])],
  controllers: [PublicAnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
