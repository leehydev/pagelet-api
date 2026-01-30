import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponseInterceptor } from './common/response/response.interceptor';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { OAuthModule } from './auth/oauth/oauth.module';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SiteModule } from './site/site.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AccountStatusGuard } from './auth/guards/account-status.guard';
import { User } from './auth/entities/user.entity';

import { PostModule } from './post/post.module';
import { DraftModule } from './draft/draft.module';
import { StorageModule } from './storage/storage.module';
import { CategoryModule } from './category/category.module';
import { BannerModule } from './banner/banner.module';
import { SuperAdminModule } from './superadmin/superadmin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { IndexingModule } from './indexing/indexing.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    OAuthModule,
    AuthModule,
    OnboardingModule,
    SiteModule,
    PostModule,
    DraftModule,
    CategoryModule,
    StorageModule,
    BannerModule,
    SuperAdminModule,
    AnalyticsModule,
    IndexingModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User]), // AccountStatusGuard에서 User Repository 사용
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AccountStatusGuard,
    },
  ],
})
export class AppModule {}
