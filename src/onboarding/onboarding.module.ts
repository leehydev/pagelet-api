import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { User } from '../auth/entities/user.entity';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SiteModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
