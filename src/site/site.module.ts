import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteController } from './site.controller';
import { SiteSettingsController } from './site-settings.controller';
import { PublicSiteSettingsController } from './public-site-settings.controller';
import { SiteService } from './site.service';
import { Site } from './entities/site.entity';
import { SiteGuard } from '../auth/guards/site.guard';
import { PublicSiteGuard } from '../auth/guards/public-site.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Site])],
  controllers: [SiteController, SiteSettingsController, PublicSiteSettingsController],
  providers: [SiteService, SiteGuard, PublicSiteGuard],
  exports: [SiteService, SiteGuard, PublicSiteGuard],
})
export class SiteModule {}
