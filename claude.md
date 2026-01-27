# CLAUDE.md - Pagelet API

## 1. 프로젝트 개요

NestJS 기반 멀티테넌트 블로그/콘텐츠 플랫폼 백엔드 API (`{slug}.pagelet.kr` 서브도메인 구조)

---

## 2. 기술 스택

| 카테고리   | 기술                  | 버전             |
| ---------- | --------------------- | ---------------- |
| Framework  | NestJS                | ^11.0.1          |
| Language   | TypeScript            | ^5.7.3           |
| Database   | PostgreSQL (Supabase) | -                |
| ORM        | TypeORM               | ^0.3.28          |
| Auth       | JWT, Passport         | ^11.0.2, ^11.0.5 |
| Storage    | AWS S3 SDK            | ^3.971.0         |
| Cache      | Redis (ioredis)       | ^5.9.2           |
| Validation | class-validator, Joi  | ^0.14.1, ^18.0.2 |
| API Docs   | Swagger               | ^11.2.5          |
| Test       | Jest                  | ^30.0.0          |

---

## 3. 디렉토리 구조

```
src/
├── main.ts                    # 앱 진입점
├── app.module.ts              # 루트 모듈
├── config/                    # 설정 (DB, JWT, S3 등)
├── database/                  # 데이터소스, 마이그레이션
├── auth/                      # 인증 (JWT, OAuth, Guards)
│   ├── oauth/                 # Kakao, Naver OAuth
│   ├── guards/                # JwtAuth, AccountStatus, AdminSite
│   └── decorators/            # @CurrentUser, @CurrentSite, @Public
├── site/                      # 사이트 관리 (멀티테넌트)
├── post/                      # 게시글 CRUD, 드래프트
├── category/                  # 카테고리 관리
├── storage/                   # S3 업로드, 스토리지 사용량
├── banner/                    # 배너 관리
├── analytics/                 # 분석 데이터
├── onboarding/                # 온보딩 플로우
├── superadmin/                # 슈퍼어드민 기능
└── common/                    # 공통 유틸리티
    ├── exception/             # ErrorCode, BusinessException
    ├── response/              # ResponseInterceptor
    ├── dto/                   # Pagination DTOs
    └── redis/                 # Redis 서비스
```

---

## 4. 자주 쓰는 명령어

```bash
# 개발
npm run local              # AWS 프로필로 로컬 실행 (watch)
npm run start:dev          # hot reload 개발 서버

# 빌드
npm run build              # TypeScript 컴파일
npm run lint               # ESLint (자동 수정)
npm run format             # Prettier 포맷팅

# 테스트
npm run test               # 단위 테스트
npm run test:cov           # 커버리지 리포트
npm run test:e2e           # E2E 테스트

# 마이그레이션
npm run migration:generate # 스키마 변경으로 마이그레이션 생성
npm run migration:run      # 마이그레이션 실행
npm run migration:run:prod # 프로덕션 마이그레이션
npm run migration:revert   # 마이그레이션 롤백
```

---

## 5. 코딩 컨벤션

### 5.1 파일 네이밍 (kebab-case)

```
admin-post.controller.ts     # Admin 전용 컨트롤러
public-post.controller.ts    # Public 컨트롤러 (인증 불필요)
post.service.ts              # 서비스
post.entity.ts               # 엔티티
create-post.dto.ts           # 요청 DTO
post-response.dto.ts         # 응답 DTO
admin-site.guard.ts          # 가드
current-user.decorator.ts    # 데코레이터
```

### 5.2 클래스 네이밍 (PascalCase)

```typescript
// Controllers: {접근레벨}{도메인}Controller
(AdminPostController, PublicPostController);

// Services: {도메인}Service
(PostService, PostDraftService);

// Entities: {도메인}
(Post, PostDraft);

// DTOs: {동작}{도메인}Dto 또는 {도메인}ResponseDto
(CreatePostDto, UpdatePostDto, PostResponseDto);

// Guards: {기능}Guard
(AdminSiteGuard, JwtAuthGuard);
```

### 5.3 Import 순서

```typescript
// 1. NestJS 코어
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// 2. 서드파티 라이브러리
import { Repository } from 'typeorm';

// 3. 도메인 모듈 (같은 모듈 내부)
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

// 4. 공통 유틸리티
import { BusinessException } from '../common/exception/business.exception';
import { ErrorCode } from '../common/exception/error-code';

// 5. Path alias
import { DatabaseConfig } from '@/config/database.config';
```

### 5.4 타입 정의 (DB Enum 사용 금지)

```typescript
// TypeScript const object 사용
export const PostStatus = {
  PRIVATE: 'PRIVATE',
  PUBLISHED: 'PUBLISHED',
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

// Entity에서는 string으로 선언
@Column({ type: 'varchar', length: 50, default: PostStatus.PRIVATE })
status: string;
```

### 5.5 Entity 컬럼 네이밍

- **TypeScript**: camelCase (`userId`)
- **Database**: snake_case (`user_id`) - SnakeNamingStrategy 자동 변환
- **JoinColumn**: 항상 명시적으로 선언

```typescript
@Column({ type: 'uuid' })
userId: string;

@ManyToOne(() => User, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'user_id' })
user: User;
```

---

## 6. 아키텍처 패턴

### 6.1 레이어 구조

```
Controller (요청/응답 처리)
    ↓
Service (비즈니스 로직)
    ↓
Repository (TypeORM)
    ↓
PostgreSQL
```

### 6.2 컨트롤러 분리 패턴

| 타입       | 접두사         | 인증               | 용도      |
| ---------- | -------------- | ------------------ | --------- |
| Admin      | `admin-*`      | 필수 + 소유권 검증 | CRUD 전체 |
| Public     | `public-*`     | 없음 (@Public)     | 읽기 전용 |
| Onboarding | `onboarding-*` | 필수 + 온보딩 상태 | 설정 단계 |

```typescript
// Admin - 사이트 소유자만 접근
@Controller('admin/sites/:siteId/posts')
@UseGuards(AdminSiteGuard)
export class AdminPostController {}

// Public - 누구나 접근
@Controller('public/posts')
@Public()
export class PublicPostController {}
```

### 6.3 가드 계층

```
Global Guards (app.module.ts에서 적용)
├── JwtAuthGuard        # JWT 토큰 검증
└── AccountStatusGuard  # 계정 상태 체크 (SUSPENDED/WITHDRAWN 차단)

Route Guards
├── AdminSiteGuard      # :siteId 파라미터로 사이트 소유권 검증
├── PublicSiteGuard     # 사이트 존재 여부만 검증
└── SuperAdminGuard     # SUPERADMIN_USER_IDS 체크
```

### 6.4 에러 처리 패턴

```typescript
// 1. ErrorCode 정의 (src/common/exception/error-code.ts)
export const ErrorCode = {
  POST_NOT_FOUND: new ErrorCodeDefinition(
    'POST_001',
    HttpStatus.NOT_FOUND,
    'Post not found',
  ),
};

// 2. BusinessException 발생
throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);

// 커스텀 메시지
throw BusinessException.fromErrorCode(
  ErrorCode.COMMON_BAD_REQUEST,
  '커스텀 에러 메시지',
);

// 3. 응답 형식 (GlobalExceptionFilter)
{
  "success": false,
  "error": { "code": "POST_001", "message": "Post not found" },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 6.5 응답 래핑 (ResponseInterceptor)

```typescript
// 컨트롤러에서 raw 데이터 반환
@Get(':id')
async getPost(@Param('id') id: string): Promise<PostResponseDto> {
  return new PostResponseDto({ ... });
}

// 자동으로 래핑됨
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 6.6 DTO 패턴

```typescript
// 요청 DTO - 유효성 검사 포함
export class CreatePostDto {
  @IsNotEmpty({ message: '제목은 필수입니다' })
  @IsString()
  @MaxLength(500, { message: '제목은 최대 500자까지 가능합니다' })
  title: string;

  @IsOptional()
  @IsIn(Object.values(PostStatus))
  status?: string;
}

// 응답 DTO - 생성자로 초기화
export class PostResponseDto {
  id: string;
  title: string;
  // ...
  constructor(partial: Partial<PostResponseDto>) {
    Object.assign(this, partial);
  }
}
```

### 6.7 페이지네이션

```typescript
// 요청
?page=1&limit=10

// 응답
{
  "items": [...],
  "totalItems": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### 6.8 트랜잭션

```typescript
import { Transactional } from 'typeorm-transactional';

@Transactional()
async atomicOperation() {
  // 모든 DB 작업이 트랜잭션으로 래핑됨
}
```

---

## 7. 환경 설정

### 7.1 환경 파일

| 파일         | 용도      | Git     |
| ------------ | --------- | ------- |
| `.env.local` | 로컬 개발 | ignored |
| `.env.prod`  | 프로덕션  | ignored |
| `.env`       | 폴백      | ignored |

### 7.2 환경 변수 목록

```env
# Server
PORT=3000                          # 필수
NODE_ENV=development               # 필수

# Database (Supabase PostgreSQL)
DB_HOST=xxx.pooler.supabase.com    # 필수
DB_PORT=5432                       # 필수
DB_USERNAME=postgres.xxx           # 필수
DB_PASSWORD=xxx                    # 필수
DB_DATABASE=postgres               # 필수

# JWT
JWT_ACCESS_SECRET=xxx              # 필수
JWT_ACCESS_EXPIRES_IN=1h           # 필수
JWT_REFRESH_SECRET=xxx             # 필수
JWT_REFRESH_EXPIRES_IN=7d          # 필수

# OAuth - Kakao
KAKAO_CLIENT_ID=xxx                # 필수
KAKAO_CLIENT_SECRET=xxx            # 필수
KAKAO_REDIRECT_URI=xxx             # 필수

# OAuth - Naver
NAVER_CLIENT_ID=xxx                # 필수
NAVER_CLIENT_SECRET=xxx            # 필수
NAVER_REDIRECT_URI=xxx             # 필수

# Frontend
FRONTEND_URL=https://app.pagelet-dev.kr  # 필수

# Cookies
COOKIE_DOMAIN=.pagelet-dev.kr      # 필수
COOKIE_SECURE=true                 # 필수

# Tenant
TENANT_DOMAIN=pagelet-dev.kr       # 필수

# Redis
REDIS_HOST=xxx                     # 필수
REDIS_PORT=xxx                     # 필수
REDIS_PASSWORD=xxx                 # 필수

# AWS S3
AWS_S3_BUCKET=xxx                  # 필수
AWS_S3_REGION=ap-northeast-2       # 필수
ASSETS_CDN_URL=xxx                 # 필수

# Super Admin
SUPERADMIN_USER_IDS=id1,id2        # 선택
```

---

## 8. 암묵적 규칙

### DO (해야 할 것)

- Admin 라우트에는 `@UseGuards(AdminSiteGuard)` 필수
- 에러는 `BusinessException.fromErrorCode()` 사용
- 응답은 DTO 클래스로 래핑: `new PostResponseDto({ ... })`
- 인증 불필요 라우트에 `@Public()` 데코레이터 사용
- 순환 의존성은 `forwardRef()` 사용
- 중요 작업은 `Logger` 로깅

### DON'T (하지 말 것)

- DB Enum 사용 금지 (TypeScript const object 사용)
- Entity 직접 반환 금지 (DTO로 변환)
- 환경 변수 하드코딩 금지 (ConfigService 사용)
- Admin 라우트에서 사이트 소유권 검증 누락 금지
- `.env.local`, `.env.prod` 커밋 금지

### 순환 의존성 처리

```typescript
// Module
@Module({
  imports: [forwardRef(() => CategoryModule)],
})
export class PostModule {}

// Service
@Inject(forwardRef(() => CategoryService))
private readonly categoryService: CategoryService;
```

---

## 9. 주요 플로우

### 인증 플로우

```
OAuth (Kakao/Naver) → User 생성/조회 → JWT 발급 (access + refresh)
→ JwtAuthGuard (토큰 검증) → AccountStatusGuard (상태 체크) → Route Guard
```

### 드래프트 시스템

```
포스트 작성 중 → PostDraft 저장 (자동/수동)
발행 시 → Draft 내용을 Post에 병합 → Draft 삭제
```

### 파일 업로드 플로우

```
Presigned URL 요청 → 클라이언트가 S3 직접 업로드 → Commit 요청
→ 스토리지 사용량 갱신 → 고아 이미지 정리 (스케줄러)
```

---

## 10. 참고 사항

- **멀티테넌트 ID**: `Site.id` (UUID)
- **테넌트 URL**: `{Site.slug}.pagelet.kr`
- **데이터 격리**: 서비스에서 siteId 기반 쿼리
- **예약된 슬러그**: www, admin, api, app 등
- **배너 제한**: 사이트당 최대 5개
