# Developer Agent

정의된 태스크를 구현하고 PR을 생성하는 개발자 에이전트입니다.

## 레포지토리

| 레포지토리  | 경로                                       | 용도                 |
| ----------- | ------------------------------------------ | -------------------- |
| pagelet-api | `/Users/mary/Projects/pagelet/pagelet-api` | 백엔드 (NestJS)      |
| pagelet-app | `/Users/mary/Projects/pagelet/pagelet-app` | 프론트엔드 (Next.js) |

---

## 워크플로우

### 1. 태스크 시작

1. 태스크 파일 확인: `.tasks/backlog/[이슈번호]-[업무-이름].md`
2. 태스크 파일을 `in-progress/`로 이동
3. 브랜치 생성
4. GitHub 이슈 스테이터스를 "In Progress"로 변경

```bash
git checkout development
git pull origin development
git checkout -b feature/[이슈번호]-[간단한-설명]
```

**브랜치 명명:**

- `feature/42-post-pagination`
- `fix/43-login-error`
- `refactor/44-api-client`

### 2. 구현

1. 태스크 파일의 체크리스트 확인
2. 코드 구현
3. **체크리스트 항목 완료할 때마다 태스크 파일에 `[x]`로 업데이트**

### 3. 검증

**순서대로 실행. 실패 시 해당 단계에서 수정 후 처음부터 재검증.**

```bash
# 1. 포맷팅
npx prettier --write .

# 2. 린트
npm run lint

# 3. 타입 체크
npx tsc --noEmit

# 4. 서버 실행 확인 (에러/경고 로그 없어야 함)
npm run start:dev

# 5. 빌드
npm run build

# 6. 테스트 (--forceExit: 열린 핸들 있어도 완료 시 종료)
npm run test -- --forceExit
```

### 4. 커밋 & PR

```bash
git add [파일들]
git commit -m "feat: 설명 (#이슈번호)"
git push -u origin feature/[이슈번호]-[설명]
gh pr create --base development --title "feat: 설명" --body "Closes #이슈번호"
```

커밋 타입: `feat` | `fix` | `refactor` | `docs` | `test` | `chore`

### 5. 태스크 완료

PR 생성 후 태스크 파일을 `review/`로 이동, GitHub 스테이터스 "pr"로 변경

---

## 마이그레이션 작성 규칙

**TypeORM 자동 생성(`migration:generate`) 사용 금지. 직접 작성할 것.**

```bash
# 타임스탬프 조회
date +%s000

# 빈 파일 생성
npx typeorm migration:create src/migrations/DescriptiveName
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

**검증:**

```bash
npm run migration:run
npm run migration:revert
npm run migration:run
```

---

## GitHub 프로젝트 Status ID

| Status      | Option ID  |
| ----------- | ---------- |
| Todo        | `f75ad846` |
| In Progress | `47fc9ee4` |
| pr          | `9ef8707a` |
| Done        | `98236657` |

---

## 금지사항

- development/main 브랜치 직접 커밋
- 검증 실패 상태로 푸시
- `.env`, credentials 커밋
- `--force` 푸시
