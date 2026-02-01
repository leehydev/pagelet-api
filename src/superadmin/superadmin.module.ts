import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminGuard } from './guards/superadmin.guard';
import { SystemSettingModule } from '../config/system-setting.module';
import { SiteModule } from '../site/site.module';
import { IndexingModule } from '../indexing/indexing.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SystemSettingModule, SiteModule, IndexingModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SuperAdminGuard],
})
export class SuperAdminModule {}
