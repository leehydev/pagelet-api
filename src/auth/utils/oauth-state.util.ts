import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';
import { RedisService } from '../../common/redis/redis.service';

/**
 * OAuth State 유틸리티
 * OAuth 인증 플로우 중 CSRF 공격 방지를 위한 state 파라미터 관리
 * 
 * OAuth State란?
 * - OAuth 인증 시작 시 생성되는 임시 토큰
 * - 인증 완료 후 콜백에서 검증하여 요청의 유효성을 확인
 * - 일회성 사용 (one-time use)
 */
@Injectable()
export class OAuthStateUtil {
  private readonly logger = new Logger(OAuthStateUtil.name);
  private readonly redis: Redis;
  private readonly statePrefix = 'oauth:state:';
  private readonly stateTtl = 600; // 10분

  constructor(private readonly redisService: RedisService) {
    // RedisService에서 싱글톤 Redis 클라이언트를 가져옵니다
    this.redis = this.redisService.getClient();
  }

  /**
   * OAuth State 생성 및 저장
   * @returns state 문자열
   */
  async generateState(): Promise<string> {
    const state = randomBytes(32).toString('hex');
    const key = `${this.statePrefix}${state}`;

    await this.redis.setex(key, this.stateTtl, '1');
    this.logger.debug(`Generated OAuth state: ${state.substring(0, 8)}...`);

    return state;
  }

  /**
   * OAuth State 검증
   * @param state 검증할 state (없으면 null/undefined 가능)
   * @returns state가 없으면 true (통과), 있으면 유효성 검증 결과
   */
  async validateState(state: string | null | undefined): Promise<boolean> {
    // State가 없으면 통과 (카카오 등 일부 프로바이더는 state 없이도 동작)
    if (!state) {
      this.logger.debug('OAuth state not provided, skipping validation');
      return true;
    }

    const key = `${this.statePrefix}${state}`;
    const result = await this.redis.get(key);

    if (result) {
      // 사용한 state는 삭제 (one-time use)
      await this.redis.del(key);
      this.logger.debug(`Validated and consumed OAuth state: ${state.substring(0, 8)}...`);
      return true;
    }

    this.logger.warn(`Invalid or expired OAuth state: ${state.substring(0, 8)}...`);
    return false;
  }
}
