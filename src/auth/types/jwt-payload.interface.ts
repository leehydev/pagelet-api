/**
 * JWT Payload 인터페이스
 */
export interface JwtPayload {
  sub: string; // userId
  roles?: string[]; // 역할 (선택)
  iat?: number; // issued at
  exp?: number; // expiration time
}

/**
 * User Principal (요청 컨텍스트에서 사용)
 */
export interface UserPrincipal {
  userId: string;
  roles?: string[];
}
