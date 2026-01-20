# Redis 모듈 사용 가이드

## 개요

`RedisModule`은 애플리케이션 전체에서 **하나의 Redis 클라이언트 인스턴스**를 싱글톤으로 제공합니다.

## 사용 방법

### 1. RedisService 주입

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../common/redis/redis.service';
import Redis from 'ioredis';

@Injectable()
export class YourService {
  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    // 싱글톤 Redis 클라이언트 가져오기
    this.redis = this.redisService.getClient();
  }
}
```

### 2. 키 Prefix로 목적 구분

같은 Redis 인스턴스를 사용하되, 키 prefix로 목적을 구분합니다:

```typescript
// OAuth State 관리
const stateKey = `oauth:state:${state}`;
await this.redis.setex(stateKey, 600, '1');

// Refresh Token 관리
const refreshKey = `refresh:token:${userId}`;
await this.redis.setex(refreshKey, 604800, refreshToken);

// Queue 작업
const queueKey = `queue:email:${taskId}`;
await this.redis.lpush('queue:email', JSON.stringify(task));
```

## 예시: Refresh Token 저장

```typescript
@Injectable()
export class RefreshTokenService {
  private readonly redis: Redis;
  private readonly prefix = 'refresh:token:';

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  async saveRefreshToken(userId: string, token: string, ttl: number) {
    const key = `${this.prefix}${userId}`;
    await this.redis.setex(key, ttl, token);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    const key = `${this.prefix}${userId}`;
    return await this.redis.get(key);
  }

  async deleteRefreshToken(userId: string) {
    const key = `${this.prefix}${userId}`;
    await this.redis.del(key);
  }
}
```

## 예시: Queue 작업

```typescript
@Injectable()
export class QueueService {
  private readonly redis: Redis;
  private readonly queueName = 'queue:email';

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  async enqueue(task: any) {
    await this.redis.lpush(this.queueName, JSON.stringify(task));
  }

  async dequeue(): Promise<any | null> {
    const result = await this.redis.brpop(this.queueName, 10);
    return result ? JSON.parse(result[1]) : null;
  }
}
```

## 주의사항

- ✅ **하나의 Redis 인스턴스만 사용**: `new Redis()`를 여러 번 호출하지 마세요
- ✅ **키 prefix 사용**: 목적별로 키 prefix를 명확히 구분하세요
- ✅ **글로벌 모듈**: `RedisModule`은 `@Global()` 데코레이터로 등록되어 있어 어디서나 주입 가능합니다
