import Redis from 'ioredis';

/**
 * Redis Lock 충돌 예외
 * 다른 프로세스가 이미 락을 획득한 경우 발생
 */
export class RedisLockConflictException extends Error {
  constructor(message = 'Another process is working') {
    super(message);
    this.name = 'RedisLockConflictException';
  }
}

/**
 * 서비스 메서드에 Redis 분산 락을 적용하는 데코레이터
 * 사용하는 클래스에 `redis: Redis` 프로퍼티가 주입되어 있어야 합니다.
 *
 * @param keyFn - 락 키를 생성하는 함수 (메서드 인자를 받음)
 * @param ttl - 락 TTL (초 단위, 기본값 5초)
 * @param redisKey - Redis 클라이언트 프로퍼티 이름 (기본값 'redis')
 *
 * @example
 * ```typescript
 * @RedisLock((args) => `refresh-lock:${args[0]}`, 5)
 * async refreshToken(userId: string): Promise<string> {
 *   // ...
 * }
 * ```
 */
export function RedisLock(
  keyFn: (args: unknown[]) => string,
  ttl = 5,
  redisKey = 'redis',
) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const redis: Redis = (this as Record<string, unknown>)[redisKey] as Redis;

      if (!redis) {
        throw new Error(
          `Redis client not found. Ensure '${redisKey}' is injected in the class.`,
        );
      }

      const lockKey = keyFn(args);

      // NX: 키가 없을 때만 설정, EX: TTL 설정
      const acquired = await redis.set(lockKey, '1', 'EX', ttl, 'NX');

      if (!acquired) {
        throw new RedisLockConflictException();
      }

      try {
        return await originalMethod.apply(this, args);
      } finally {
        await redis.del(lockKey);
      }
    };

    return descriptor;
  };
}
