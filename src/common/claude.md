# Common 모듈

공통 유틸리티, 예외 처리, 응답 형식을 담당합니다.

## 구성요소

### exception/

에러 처리 시스템

```typescript
// 에러 코드 정의
export const ErrorCode = {
  POST_NOT_FOUND: new ErrorCodeDefinition(
    'POST_001',
    HttpStatus.NOT_FOUND,
    'Post not found',
  ),
} as const;

// 예외 발생
throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
throw BusinessException.fromErrorCode(ErrorCode.COMMON_BAD_REQUEST, 'custom message');
```

### response/

API 응답 래핑

```typescript
// ResponseInterceptor가 자동으로 래핑
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "POST_001",
    "message": "Post not found"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### redis/

Redis 연결 및 유틸리티

- `RedisService` - Redis 클라이언트 래퍼
- `@RedisLock()` - 분산 락 데코레이터

### decorators/

공통 데코레이터

- `@RedisLock(key, ttl)` - 분산 락

## ErrorCode 추가 방법

```typescript
// src/common/exception/error-code.ts

// 도메인별 접두사 사용: DOMAIN_001, DOMAIN_002, ...
NEW_FEATURE_NOT_FOUND: new ErrorCodeDefinition(
  'NEW_FEATURE_001',
  HttpStatus.NOT_FOUND,
  'Feature not found',
),
```

## 주의사항

- 새 도메인 추가 시 ErrorCode에 해당 도메인 에러 추가
- ResponseInterceptor가 전역 적용되어 있음
