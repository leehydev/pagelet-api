import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from './api-response.dto';

/**
 * Response Interceptor
 * Controller에서 반환하는 순수 데이터를 공통 응답 포맷으로 래핑
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // 이미 ApiResponseDto 형식인 경우 그대로 반환
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        // 순수 데이터인 경우 래핑
        return new ApiResponseDto(data);
      }),
    );
  }
}
