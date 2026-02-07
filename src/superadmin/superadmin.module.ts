import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Site } from '../site/entities/site.entity';
import { Post } from '../post/entities/post.entity';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminGuard } from './guards/superadmin.guard';
import { SystemSettingModule } from '../config/system-setting.module';
import { SiteModule } from '../site/site.module';
import { IndexingModule } from '../indexing/indexing.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Site, Post]),
    SystemSettingModule,
    SiteModule,
    IndexingModule,
    StorageModule,
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SuperAdminGuard],
})
export class SuperAdminModule {}
