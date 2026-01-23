import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/exception/http-exception.filter';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log(`서버 시작: "${process.env.NODE_ENV}" mode`);
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Cookie Parser 설정
  app.use(cookieParser());

  // CORS 설정 (크로스 도메인 쿠키 지원)
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  const tenantDomain = configService.get<string>('TENANT_DOMAIN', 'localhost:3001');
  app.enableCors({
    origin: (origin, callback) => {
      // origin이 없는 경우 (서버 간 요청 등) 허용
      if (!origin) {
        callback(null, true);
        return;
      }
      // FRONTEND_URL 허용
      if (origin === frontendUrl) {
        callback(null, true);
        return;
      }
      // 테넌트 서브도메인 허용 (*.pagelet-dev.kr)
      const tenantPattern = new RegExp(
        `^https?://[a-z0-9-]+\\.${tenantDomain.replace('.', '\\.')}$`,
      );
      if (tenantPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS not allowed'), false);
    },
    credentials: true, // 쿠키 전송 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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

  // Swagger 설정 (프로덕션 환경에서는 비활성화)
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Pagelet API')
      .setDescription('Pagelet API 문서')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);
    logger.log(`Swagger 문서: http://localhost:${process.env.PORT ?? 3000}/api-docs`);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
