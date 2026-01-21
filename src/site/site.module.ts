import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicSiteController } from './public-site.controller';
import { AdminSiteController } from './admin-site.controller';
import { AdminSiteSettingsController } from './admin-site-settings.controller';
import { PublicSiteSettingsController } from './public-site-settings.controller';
import { SiteService } from './site.service';
import { Site } from './entities/site.entity';
import { SiteGuard } from '../auth/guards/site.guard';
import { PublicSiteGuard } from '../auth/guards/public-site.guard';
import { AdminSiteGuard } from '../auth/guards/admin-site.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Site])],
  controllers: [PublicSiteController, AdminSiteController, AdminSiteSettingsController, PublicSiteSettingsController],
  providers: [SiteService, SiteGuard, PublicSiteGuard, AdminSiteGuard],
  exports: [SiteService, SiteGuard, PublicSiteGuard, AdminSiteGuard],
})
export class SiteModule {}
