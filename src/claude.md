# 소스 코드 규칙

## 파일 네이밍

- **kebab-case**: `admin-post.controller.ts`, `create-post.dto.ts`
- Controller 분리:
  - `admin-*.controller.ts` - 관리자용 (인증 필요)
  - `public-*.controller.ts` - 공개용 (인증 불필요)
  - `onboarding-*.controller.ts` - 온보딩용
- 도메인별 폴더: `entities/`, `dto/`

## 클래스 네이밍

- **PascalCase**
- Controller: `AdminPostController`, `PublicPostController`
- Service: `PostService`
- Entity: `Post`, `Site`
- DTO: `CreatePostDto`, `PostResponseDto`

## API 엔드포인트 패턴

```typescript
// Admin API - 인증 + 사이트 권한 필요
@Controller('admin/sites/:siteId/posts')
@UseGuards(AdminSiteGuard)

// Public API - 인증 불필요
@Controller('public/posts')
@Public()
```

## Entity 정의

```typescript
// DB enum 대신 const object 사용
export const PostStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
```

## Request DTO

```typescript
export class CreatePostDto {
  @IsNotEmpty({ message: '제목은 필수입니다' })
  @IsString()
  @MaxLength(500, { message: '제목은 최대 500자까지 가능합니다' })
  title: string;

  @IsOptional()
  @IsString()
  content?: string;
}
```

## Response DTO

```typescript
export class PostResponseDto {
  id: string;
  title: string;
  createdAt: Date;

  constructor(partial: Partial<PostResponseDto>) {
    Object.assign(this, partial);
  }
}

// Controller에서 사용
return new PostResponseDto({
  id: post.id,
  title: post.title,
  createdAt: post.createdAt,
});
```

## 예외 처리

```typescript
// 에러 코드로 예외 발생
throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);

// 커스텀 메시지와 함께
throw BusinessException.fromErrorCode(
  ErrorCode.COMMON_BAD_REQUEST,
  'siteSlug query parameter is required',
);
```

## ErrorCode 추가

```typescript
// src/common/exception/error-code.ts
NEW_DOMAIN_NOT_FOUND: new ErrorCodeDefinition(
  'NEW_DOMAIN_001',
  HttpStatus.NOT_FOUND,
  'Resource not found',
),
```

## 모듈 구조

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    SiteModule,
    forwardRef(() => CategoryModule), // 순환 참조 시
  ],
  controllers: [AdminPostController, PublicPostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
```

## Guard 사용

```typescript
// AdminSiteGuard: URL의 :siteId로 사이트 소유권 검증
@UseGuards(AdminSiteGuard)

// 데코레이터로 주입된 정보 사용
@CurrentUser() user: UserPrincipal  // JWT에서 추출
@CurrentSite() site: Site            // Guard에서 설정
```

## 중요 규칙

1. **응답은 DTO 클래스로 래핑**: `new PostResponseDto({ ... })`
2. **에러는 ErrorCode 정의 후 BusinessException으로 발생**
3. **Admin/Public Controller 분리**
4. **Entity 관계는 명시적 JoinColumn 사용**
