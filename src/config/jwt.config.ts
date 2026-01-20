import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

/**
 * JWT 토큰 설정 인터페이스
 */
export interface JwtTokenConfig {
  secret: string;
  expiresIn: StringValue;
}

/**
 * JWT 설정 인터페이스
 */
export interface JwtConfig {
  access: JwtTokenConfig;
  refresh: JwtTokenConfig;
}

/**
 * JWT 설정 팩토리
 * registerAs를 사용하여 'jwt' 네임스페이스로 등록
 */
export default registerAs<JwtConfig>('jwt', () => {
  return {
    access: {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN! as StringValue,
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN! as StringValue,
    },
  };
});
