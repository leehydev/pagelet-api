import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteBanner } from './entities/site-banner.entity';
import { BannerService } from './banner.service';
import { AdminBannerController } from './admin-banner.controller';
import { PublicBannerController } from './public-banner.controller';
import { SiteModule } from '../site/site.module';
import { PostModule } from '../post/post.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteBanner]),
    SiteModule,
    forwardRef(() => PostModule),
  ],
  controllers: [AdminBannerController, PublicBannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
