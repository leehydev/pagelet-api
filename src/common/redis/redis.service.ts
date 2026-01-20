import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis 서비스 (싱글톤)
 * 애플리케이션 전체에서 하나의 Redis 클라이언트 인스턴스를 공유합니다.
 * 목적별로 키 prefix를 사용하여 구분합니다:
 * - oauth:state: - OAuth state 관리
 * - refresh:token: - Refresh token 관리
 * - queue: - 작업 큐
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD') || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });
  }

  /**
   * Redis 클라이언트 인스턴스 반환
   * @returns Redis 클라이언트
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Redis 연결 종료
   */
  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }
}
