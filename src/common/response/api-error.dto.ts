/**
 * API 에러 응답 DTO
 */
export class ApiErrorDto {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };

  constructor(code: string, message: string, details?: any) {
    this.success = false;
    this.error = {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    };
  }
}
