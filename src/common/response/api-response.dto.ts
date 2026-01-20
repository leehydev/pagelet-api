/**
 * API 성공 응답 DTO
 */
export class ApiResponseDto<T = any> {
  success: boolean;
  data: T;
  timestamp: string;

  constructor(data: T) {
    this.success = true;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}
