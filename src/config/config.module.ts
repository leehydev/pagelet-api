import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import s3Config from './s3.config';
import { JoiMsString } from 'src/common/utils/validation/joi-ms-string';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig, jwtConfig, s3Config],
      validationSchema: Joi.object({
        // Server
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

        // Database
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        DB_SCHEMA: Joi.string().optional(),
        DB_RDS_CA_BASE64: Joi.string().optional(),

        // JWT
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES_IN: JoiMsString.required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRES_IN: JoiMsString.required(),

        // Kakao OAuth
        KAKAO_CLIENT_ID: Joi.string().required(),
        KAKAO_CLIENT_SECRET: Joi.string().required(),
        KAKAO_REDIRECT_URI: Joi.string().required(),

        // Naver OAuth
        NAVER_CLIENT_ID: Joi.string().required(),
        NAVER_CLIENT_SECRET: Joi.string().required(),
        NAVER_REDIRECT_URI: Joi.string().required(),

        // Frontend
        FRONTEND_URL: Joi.string().default('http://localhost:3001'),

        // Cookie
        COOKIE_DOMAIN: Joi.string().optional(),
        COOKIE_SECURE: Joi.string().valid('true', 'false').default('false'),
        COOKIE_SAME_SITE: Joi.string().valid('strict', 'lax', 'none').default('lax'),

        // Redis
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional(),

        // AWS S3
        AWS_S3_BUCKET: Joi.string().default('pagelet-uploads'),
        AWS_S3_REGION: Joi.string().default('ap-northeast-2'),
        ASSETS_CDN_URL: Joi.string().default('https://assets.pagelet-dev.kr'),

        // Tenant
        TENANT_DOMAIN: Joi.string().default('pagelet-dev.kr'),

        // SuperAdmin
        SUPERADMIN_USER_IDS: Joi.string().optional().default(''),

        // Google Indexing API (로컬: 파일 경로, 상용: AWS Secrets Manager JSON)
        GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: Joi.string().optional(),
        GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_FILE: Joi.string().optional(),
      }),
    }),
  ],
})
export class ConfigModule {}
