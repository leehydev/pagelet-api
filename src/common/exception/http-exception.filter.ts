import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorDto } from '../response/api-error.dto';
import { BusinessException } from './business.exception';
import { ErrorCode } from './error-code';

/**
 * 글로벌 예외 필터
 * 모든 예외를 일관된 포맷으로 처리
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let errorCode: string;
    let message: string;
    let details: any;

    // BusinessException 처리
    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      errorCode = exception.errorCode.code;
      message = exception.message;
      details = exception.details;

      this.logger.warn(
        `BusinessException: ${errorCode} - ${message}`,
        exception.stack,
      );
    }
    // NestJS HttpException 처리 (Validation 등)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // NotFoundException 처리 (404)
      if (exception instanceof NotFoundException) {
        errorCode = ErrorCode.COMMON_NOT_FOUND.code;
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : 'Not found';

        // favicon.ico 같은 일반적인 요청은 로깅하지 않음
        const url = request.url;
        const shouldLog = !url.includes('favicon.ico') && !url.includes('robots.txt');
        
        if (shouldLog) {
          this.logger.debug(`NotFoundException: ${url}`);
        }
      }
      // ValidationPipe에서 발생한 에러 처리
      else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const messages = (exceptionResponse as any).message;
        errorCode = ErrorCode.COMMON_VALIDATION_ERROR.code;
        message = Array.isArray(messages)
          ? 'Validation failed'
          : messages || 'Validation failed';
        details = Array.isArray(messages) ? { fields: messages } : undefined;

        this.logger.warn(
          `ValidationError: ${JSON.stringify(messages)}`,
          exception.stack,
        );
      } else {
        errorCode = ErrorCode.COMMON_BAD_REQUEST.code;
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : 'Bad request';
      }
    }
    // 예상하지 못한 예외 처리 (500)
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = ErrorCode.COMMON_INTERNAL_SERVER_ERROR.code;
      message = 'Internal server error';

      // 프로덕션에서는 상세 정보를 숨기고, 개발 환경에서만 표시
      if (process.env.NODE_ENV !== 'production') {
        details = {
          error: exception instanceof Error ? exception.message : String(exception),
          stack: exception instanceof Error ? exception.stack : undefined,
        };
      }

      this.logger.error(
        `Unexpected error: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorResponse = new ApiErrorDto(errorCode, message, details);

    response.status(status).json(errorResponse);
  }
}
