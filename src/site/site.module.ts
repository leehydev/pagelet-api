import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicSiteController } from './public-site.controller';
import { AdminSiteController } from './admin-site.controller';
import { AdminSiteSettingsController } from './admin-site-settings.controller';
import { PublicSiteSettingsController } from './public-site-settings.controller';
import { SiteService } from './site.service';
import { Site } from './entities/site.entity';
import { ReservedSlug } from './entities/reserved-slug.entity';
import { SiteGuard } from '../auth/guards/site.guard';
import { PublicSiteGuard } from '../auth/guards/public-site.guard';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Site, ReservedSlug]), forwardRef(() => StorageModule)],
  controllers: [
    PublicSiteController,
    AdminSiteController,
    AdminSiteSettingsController,
    PublicSiteSettingsController,
  ],
  providers: [SiteService, SiteGuard, PublicSiteGuard],
  exports: [SiteService, SiteGuard, PublicSiteGuard],
})
export class SiteModule {}
