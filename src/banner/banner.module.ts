import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteBanner } from './entities/site-banner.entity';
import { BannerService } from './banner.service';
import { AdminBannerController } from './admin-banner.controller';
import { PublicBannerController } from './public-banner.controller';
import { SiteModule } from '../site/site.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([SiteBanner]), SiteModule, StorageModule],
  controllers: [AdminBannerController, PublicBannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
