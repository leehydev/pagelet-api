import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/exception/http-exception.filter';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log(`서버 시작: "${process.env.NODE_ENV}" mode`);
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(AppModule);

  // 글로벌 예외 필터 등록
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 글로벌 ValidationPipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있으면 에러
      transform: true, // 요청 데이터를 DTO 인스턴스로 자동 변환
      transformOptions: {
        enableImplicitConversion: true, // 타입 자동 변환 활성화
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
