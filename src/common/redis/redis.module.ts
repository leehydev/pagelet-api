import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { RedisService } from './redis.service';

/**
 * Redis 모듈 (글로벌)
 * 애플리케이션 전체에서 RedisService를 사용할 수 있도록 글로벌 모듈로 등록합니다.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
