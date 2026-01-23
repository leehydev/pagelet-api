import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KakaoOAuthClient } from './clients/kakao/kakao-oauth.client';
import { KakaoOAuthService } from './services/kakao-oauth.service';
import { NaverOAuthClient } from './clients/naver/naver-oauth.client';
import { NaverOAuthService } from './services/naver-oauth.service';

@Module({
  imports: [HttpModule],
  providers: [KakaoOAuthClient, KakaoOAuthService, NaverOAuthClient, NaverOAuthService],
  exports: [KakaoOAuthService, NaverOAuthService],
})
export class OAuthModule {}
