import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';
import { SocialAccount } from './entities/social-account.entity';
import { OAuthModule } from './oauth/oauth.module';
import { JwtConfig } from '../config/jwt.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.get<JwtConfig>('jwt')!;
        return {
          // JwtService.signAsync()에서 직접 secret을 지정하지만,
          // 기본값으로 access token 설정을 제공
          secret: jwtConfig.access.secret,
          signOptions: {
            expiresIn: jwtConfig.access.expiresIn,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([User, SocialAccount]),
    OAuthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
