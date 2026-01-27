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

  // 계정 상태 관련 에러
  ACCOUNT_SUSPENDED: new ErrorCodeDefinition(
    'ACCOUNT_001',
    HttpStatus.FORBIDDEN,
    'Account is suspended',
  ),
  ACCOUNT_WITHDRAWN: new ErrorCodeDefinition(
    'ACCOUNT_002',
    HttpStatus.FORBIDDEN,
    'Account has been withdrawn',
  ),
  ACCOUNT_PENDING: new ErrorCodeDefinition(
    'ACCOUNT_003',
    HttpStatus.FORBIDDEN,
    'Account is pending approval',
  ),

  // OAuth 관련 에러
  OAUTH_INVALID_CODE: new ErrorCodeDefinition(
    'OAUTH_001',
    HttpStatus.BAD_REQUEST,
    'Invalid authorization code',
  ),
  OAUTH_TOKEN_EXPIRED: new ErrorCodeDefinition(
    'OAUTH_002',
    HttpStatus.UNAUTHORIZED,
    'OAuth token expired',
  ),
  OAUTH_USER_INFO_FAILED: new ErrorCodeDefinition(
    'OAUTH_003',
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Failed to retrieve user information',
  ),
  OAUTH_PROVIDER_ERROR: new ErrorCodeDefinition(
    'OAUTH_004',
    HttpStatus.BAD_GATEWAY,
    'OAuth provider error',
  ),
  OAUTH_INSUFFICIENT_SCOPE: new ErrorCodeDefinition(
    'OAUTH_005',
    HttpStatus.FORBIDDEN,
    'Insufficient OAuth scope',
  ),

  // 온보딩 관련 에러
  ONBOARDING_NOT_ALLOWED: new ErrorCodeDefinition(
    'ONBOARDING_001',
    HttpStatus.FORBIDDEN,
    'Onboarding not allowed for this user',
  ),
  ONBOARDING_INVALID_STEP: new ErrorCodeDefinition(
    'ONBOARDING_002',
    HttpStatus.BAD_REQUEST,
    'Invalid onboarding step',
  ),

  // 사이트 관련 에러
  SITE_SLUG_NOT_AVAILABLE: new ErrorCodeDefinition(
    'SITE_001',
    HttpStatus.CONFLICT,
    'Slug is not available',
  ),
  SITE_NOT_FOUND: new ErrorCodeDefinition('SITE_002', HttpStatus.NOT_FOUND, 'Site not found'),
  SITE_HEADER_MISSING: new ErrorCodeDefinition(
    'SITE_003',
    HttpStatus.BAD_REQUEST,
    'X-Site-Id header is required',
  ),
  SITE_SLUG_RESERVED_ADMIN_ONLY: new ErrorCodeDefinition(
    'SITE_004',
    HttpStatus.FORBIDDEN,
    'This slug is reserved for admin users only',
  ),

  // 예약어 슬러그 관련 에러
  RESERVED_SLUG_NOT_FOUND: new ErrorCodeDefinition(
    'RESERVED_SLUG_001',
    HttpStatus.NOT_FOUND,
    'Reserved slug not found',
  ),
  RESERVED_SLUG_ALREADY_EXISTS: new ErrorCodeDefinition(
    'RESERVED_SLUG_002',
    HttpStatus.CONFLICT,
    'Reserved slug already exists',
  ),

  // 게시글 관련 에러
  POST_NOT_FOUND: new ErrorCodeDefinition('POST_001', HttpStatus.NOT_FOUND, 'Post not found'),
  POST_SLUG_ALREADY_EXISTS: new ErrorCodeDefinition(
    'POST_002',
    HttpStatus.CONFLICT,
    'Post slug already exists in this site',
  ),
  POST_ACCESS_DENIED: new ErrorCodeDefinition(
    'POST_003',
    HttpStatus.FORBIDDEN,
    'Access denied to this post',
  ),
  POST_NOT_PUBLISHED: new ErrorCodeDefinition(
    'POST_004',
    HttpStatus.BAD_REQUEST,
    'Post is not published',
  ),

  // Storage 관련 에러
  STORAGE_EXCEEDED: new ErrorCodeDefinition(
    'STORAGE_001',
    HttpStatus.BAD_REQUEST,
    'Storage quota exceeded',
  ),
  STORAGE_RESERVE_FAILED: new ErrorCodeDefinition(
    'STORAGE_002',
    HttpStatus.BAD_REQUEST,
    'Failed to reserve storage',
  ),
  UPLOAD_INVALID: new ErrorCodeDefinition(
    'STORAGE_003',
    HttpStatus.BAD_REQUEST,
    'Invalid upload request',
  ),
  UPLOAD_NOT_FOUND: new ErrorCodeDefinition(
    'STORAGE_004',
    HttpStatus.NOT_FOUND,
    'Upload not found',
  ),

  // 카테고리 관련 에러
  CATEGORY_NOT_FOUND: new ErrorCodeDefinition(
    'CATEGORY_001',
    HttpStatus.NOT_FOUND,
    'Category not found',
  ),
  CATEGORY_SLUG_ALREADY_EXISTS: new ErrorCodeDefinition(
    'CATEGORY_002',
    HttpStatus.CONFLICT,
    'Category slug already exists in this site',
  ),
  CATEGORY_SLUG_RESERVED: new ErrorCodeDefinition(
    'CATEGORY_003',
    HttpStatus.BAD_REQUEST,
    'Category slug is reserved',
  ),
  CATEGORY_HAS_POSTS: new ErrorCodeDefinition(
    'CATEGORY_004',
    HttpStatus.BAD_REQUEST,
    'Cannot delete category with existing posts',
  ),

  // 배너 관련 에러
  BANNER_NOT_FOUND: new ErrorCodeDefinition(
    'BANNER_001',
    HttpStatus.NOT_FOUND,
    '배너를 찾을 수 없습니다',
  ),

  // 시스템 설정 관련 에러
  SETTING_NOT_FOUND: new ErrorCodeDefinition(
    'SETTING_001',
    HttpStatus.NOT_FOUND,
    '시스템 설정을 찾을 수 없습니다',
  ),
  SETTING_INVALID_VALUE: new ErrorCodeDefinition(
    'SETTING_002',
    HttpStatus.BAD_REQUEST,
    '유효하지 않은 설정 값입니다',
  ),
  BANNER_LIMIT_EXCEEDED: new ErrorCodeDefinition(
    'BANNER_002',
    HttpStatus.BAD_REQUEST,
    '배너는 최대 5개까지 등록할 수 있습니다',
  ),
  BANNER_INVALID_LINK: new ErrorCodeDefinition(
    'BANNER_003',
    HttpStatus.BAD_REQUEST,
    '유효하지 않은 링크 URL입니다',
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
