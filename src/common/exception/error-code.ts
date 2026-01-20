import { HttpStatus } from '@nestjs/common';

/**
 * 에러 코드 정의 클래스
 */
class ErrorCodeDefinition {
  constructor(
    public readonly code: string,
    public readonly httpStatus: HttpStatus,
    public readonly defaultMessage: string,
  ) {}
}

/**
 * 에러 코드 정의
 * Java 스타일로 code, httpStatus, defaultMessage를 함께 정의
 *
 * 사용 예시:
 * throw BusinessException.fromErrorCode(ErrorCode.COMMON_INVALID_INPUT);
 */
export const ErrorCode = {
  // 공통 에러
  COMMON_INTERNAL_SERVER_ERROR: new ErrorCodeDefinition(
    'COMMON_001',
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
  ),
  COMMON_VALIDATION_ERROR: new ErrorCodeDefinition(
    'COMMON_002',
    HttpStatus.BAD_REQUEST,
    'Validation failed',
  ),
  COMMON_UNAUTHORIZED: new ErrorCodeDefinition(
    'COMMON_003',
    HttpStatus.UNAUTHORIZED,
    'Unauthorized',
  ),
  COMMON_FORBIDDEN: new ErrorCodeDefinition('COMMON_004', HttpStatus.FORBIDDEN, 'Forbidden'),
  COMMON_NOT_FOUND: new ErrorCodeDefinition('COMMON_005', HttpStatus.NOT_FOUND, 'Not found'),
  COMMON_BAD_REQUEST: new ErrorCodeDefinition('COMMON_006', HttpStatus.BAD_REQUEST, 'Bad request'),

  // 사용자 관련 에러
  USER_NOT_FOUND: new ErrorCodeDefinition('USER_001', HttpStatus.NOT_FOUND, 'User not found'),
  USER_ALREADY_EXISTS: new ErrorCodeDefinition(
    'USER_002',
    HttpStatus.CONFLICT,
    'User already exists',
  ),
  USER_INVALID_CREDENTIALS: new ErrorCodeDefinition(
    'USER_003',
    HttpStatus.UNAUTHORIZED,
    'Invalid credentials',
  ),
} as const;

/**
 * ErrorCode 타입 (타입 안정성을 위해)
 */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * 에러 코드별 HTTP 상태 코드 및 기본 메시지 매핑
 * (하위 호환성을 위해 유지)
 */
export const ErrorCodeMap: Record<string, { httpStatus: HttpStatus; defaultMessage: string }> =
  Object.values(ErrorCode).reduce(
    (acc, errorCode) => {
      acc[errorCode.code] = {
        httpStatus: errorCode.httpStatus,
        defaultMessage: errorCode.defaultMessage,
      };
      return acc;
    },
    {} as Record<string, { httpStatus: HttpStatus; defaultMessage: string }>,
  );
