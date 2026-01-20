import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteController } from './site.controller';
import { SiteSettingsController } from './site-settings.controller';
import { PublicSiteSettingsController } from './public-site-settings.controller';
import { SiteService } from './site.service';
import { Site } from './entities/site.entity';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { PublicTenantGuard } from '../auth/guards/public-tenant.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Site])],
  controllers: [SiteController, SiteSettingsController, PublicSiteSettingsController],
  providers: [SiteService, TenantGuard, PublicTenantGuard],
  exports: [SiteService, TenantGuard, PublicTenantGuard],
})
export class SiteModule {}
