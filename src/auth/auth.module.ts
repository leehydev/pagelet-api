import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OAuthStateUtil } from './utils/oauth-state.util';
import { User } from './entities/user.entity';
import { SocialAccount } from './entities/social-account.entity';
import { OAuthModule } from './oauth/oauth.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // JwtStrategy에서 secret을 사용하므로 여기서는 기본값만 설정
        // 실제 secret은 JwtStrategy에서 주입받음
      }),
    }),
    TypeOrmModule.forFeature([User, SocialAccount]),
    OAuthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OAuthStateUtil],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
