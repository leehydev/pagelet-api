import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { SuperAdminController } from './superadmin.controller';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminGuard } from './guards/superadmin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SuperAdminGuard],
})
export class SuperAdminModule {}
