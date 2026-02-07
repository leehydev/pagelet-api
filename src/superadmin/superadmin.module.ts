import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/entities/user.entity';
import { Site } from '../site/entities/site.entity';
import { Post } from '../post/entities/post.entity';
import { SiteStorageUsage } from '../storage/entities/storage-usage.entity';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminDashboardController } from './controllers/superadmin-dashboard.controller';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminGuard } from './guards/superadmin.guard';
import { SystemSettingModule } from '../config/system-setting.module';
import { SiteModule } from '../site/site.module';
import { IndexingModule } from '../indexing/indexing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Site, Post, SiteStorageUsage]),
    SystemSettingModule,
    SiteModule,
    IndexingModule,
  ],
  controllers: [SuperAdminController, SuperAdminDashboardController],
  providers: [SuperAdminService, SuperAdminGuard],
})
export class SuperAdminModule {}
