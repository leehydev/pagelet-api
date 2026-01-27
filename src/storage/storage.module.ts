import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostImage } from './entities/post-image.entity';
import { SiteStorageUsage } from './entities/storage-usage.entity';
import { SiteBrandingImage } from './entities/site-branding-image.entity';
import { S3Service } from './s3.service';
import { StorageUsageService } from './storage-usage.service';
import { PostImageService } from './post-image.service';
import { UploadService } from './upload.service';
import { AdminUploadController } from './admin-upload.controller';
import { AdminUploadV2Controller } from './admin-upload-v2.controller';
import { StorageCleanupService } from './storage-cleanup.service';
import { BrandingAssetService } from './branding-asset.service';
import { AdminBrandingAssetController } from './admin-branding-asset.controller';
import { AdminBrandingAssetV2Controller } from './admin-branding-asset-v2.controller';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostImage, SiteStorageUsage, SiteBrandingImage]),
    forwardRef(() => SiteModule),
  ],
  controllers: [
    AdminUploadController,
    AdminUploadV2Controller,
    AdminBrandingAssetController,
    AdminBrandingAssetV2Controller,
  ],
  providers: [
    S3Service,
    StorageUsageService,
    PostImageService,
    UploadService,
    StorageCleanupService,
    BrandingAssetService,
  ],
  exports: [S3Service, StorageUsageService, PostImageService, UploadService, BrandingAssetService],
})
export class StorageModule {}
