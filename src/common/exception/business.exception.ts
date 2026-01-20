import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code';

/**
 * 비즈니스 로직 예외 베이스 클래스
 * 도메인별 예외(UserException 등)가 이 클래스를 상속하여 사용
 */
export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: any;

  constructor(errorCode: ErrorCode, message?: string, details?: any, httpStatus?: HttpStatus) {
    const statusCode = httpStatus || errorCode.httpStatus;
    const errorMessage = message || errorCode.defaultMessage;

    super(
      {
        code: errorCode.code,
        message: errorMessage,
        ...(details && { details }),
      },
      statusCode,
    );

    this.errorCode = errorCode;
    this.details = details;
  }

  /**
   * 에러 코드만으로 예외 생성 (기본 메시지 사용)
   */
  static fromErrorCode(errorCode: ErrorCode, details?: any): BusinessException {
    return new BusinessException(errorCode, undefined, details);
  }

  /**
   * 커스텀 메시지와 함께 예외 생성
   */
  static withMessage(errorCode: ErrorCode, message: string, details?: any): BusinessException {
    return new BusinessException(errorCode, message, details);
  }
}
