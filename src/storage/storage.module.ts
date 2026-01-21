import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostImage } from './entities/post-image.entity';
import { SiteStorageUsage } from './entities/storage-usage.entity';
import { S3Service } from './s3.service';
import { StorageUsageService } from './storage-usage.service';
import { PostImageService } from './post-image.service';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { StorageCleanupService } from './storage-cleanup.service';
import { BrandingAssetService } from './branding-asset.service';
import { BrandingAssetController } from './branding-asset.controller';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [TypeOrmModule.forFeature([PostImage, SiteStorageUsage]), SiteModule],
  controllers: [UploadController, BrandingAssetController],
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
