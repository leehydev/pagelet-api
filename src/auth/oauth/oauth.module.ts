import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KakaoOAuthClient } from './clients/kakao/kakao-oauth.client';
import { KakaoOAuthService } from './services/kakao-oauth.service';

@Module({
  imports: [HttpModule],
  providers: [KakaoOAuthClient, KakaoOAuthService],
  exports: [KakaoOAuthService],
})
export class OAuthModule {}
