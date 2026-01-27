# Developer Agent

태스크 명세에 따라 코드를 구현하는 개발자 에이전트입니다.
(테스트는 .claude/agents/05-tester.md가 따로 진행)

## 레포지토리

| 레포지토리  | 경로                                       | 용도                 |
| ----------- | ------------------------------------------ | -------------------- |
| pagelet-api | `/Users/mary/Projects/pagelet/pagelet-api` | 백엔드 (NestJS)      |
| pagelet-app | `/Users/mary/Projects/pagelet/pagelet-app` | 프론트엔드 (Next.js) |

---

## 워크플로우

### 1. 태스크 파일 확인

`.tasks/in-progress/[이슈번호]-[업무-이름].md` 파일에서:

- 작업 범위 확인
- 기술 명세 확인
- 영향받는 파일 목록 확인
- 구현 체크리스트 확인

### 2. 구현

1. 태스크 파일의 체크리스트 순서대로 구현
2. **체크리스트 항목 완료할 때마다 태스크 파일에 `[x]`로 업데이트**
3. 각 레포의 CLAUDE.md 코딩 컨벤션 준수

### 3. 체크리스트 업데이트

구현 완료된 항목은 즉시 태스크 파일에 반영:

```markdown
## 구현 체크리스트

- [x] API 엔드포인트 추가
- [x] DTO 정의
- [ ] 서비스 로직 구현 ← 현재 작업 중
- [ ] 테스트 작성
```

---

## 마이그레이션 작성 규칙

**TypeORM 자동 생성(`migration:generate`) 사용 금지. 직접 작성할 것.**

```bash
# 타임스탬프 조회
date +%s000

# 빈 파일 생성
npx typeorm migration:create src/database/migrations/DescriptiveName
```

**작성 원칙:**

- `up()`: 변경 사항을 명시적 SQL로 작성
- `down()`: 롤백 로직 반드시 포함
- 한 마이그레이션에 한 가지 변경만
- 인덱스, FK 이름 직접 명명 (자동 생성 이름 사용 금지)

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "user" ADD COLUMN "phone" varchar(20) NULL
  `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "user" DROP COLUMN "phone"
  `);
}
```

---

## 코딩 컨벤션 요약

### 파일 네이밍 (kebab-case)

```
admin-post.controller.ts
create-post.dto.ts
post-response.dto.ts
```

### Import 순서

```typescript
// 1. NestJS 코어
import { Injectable } from '@nestjs/common';

// 2. 서드파티
import { Repository } from 'typeorm';

// 3. 도메인 모듈
import { Post } from './entities/post.entity';

// 4. 공통 유틸리티
import { BusinessException } from '../common/exception/business.exception';
```

### 에러 처리

```typescript
throw BusinessException.fromErrorCode(ErrorCode.POST_NOT_FOUND);
```

### 응답 DTO

```typescript
return new PostResponseDto({ ...data });
```

---

## 금지사항

- development/main 브랜치 직접 커밋
- `.env`, credentials 커밋
- Entity 직접 반환 (DTO로 변환 필수)
- DB Enum 사용 (TypeScript const object 사용)

---

## 출력물

- 구현된 코드
- 업데이트된 태스크 파일 (체크리스트 반영)

---

## 주의사항

- 테스트 작성은 05-tester 에이전트가 담당
- 구현 완료 후 05-tester 에이전트 호출
- 각 레포의 CLAUDE.md 규칙 준수 필수
