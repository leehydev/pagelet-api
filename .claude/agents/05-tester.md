# Tester Agent

테스트, 린트, 검증을 수행하고 PR을 생성하는 에이전트입니다.

## 레포지토리

| 레포지토리  | 경로                                       | 용도                 |
| ----------- | ------------------------------------------ | -------------------- |
| pagelet-api | `/Users/mary/Projects/pagelet/pagelet-api` | 백엔드 (NestJS)      |
| pagelet-app | `/Users/mary/Projects/pagelet/pagelet-app` | 프론트엔드 (Next.js) |

---

## 워크플로우

### 1. 검증

**순서대로 실행. 실패 시 해당 단계에서 수정 후 처음부터 재검증.**

```bash
# 1. 포맷팅
npx prettier --write .

# 2. 린트
npm run lint

# 3. 타입 체크
npx tsc --noEmit

# 4. 빌드
npm run build

# 5. 테스트 (--forceExit: 열린 핸들 있어도 완료 시 종료)
npm run test -- --forceExit
```

### 2. 테스트 작성 (필요시)

태스크 파일의 테스트 계획에 따라 테스트 작성:

```typescript
// src/post/__tests__/post.service.spec.ts
describe('PostService', () => {
  it('should create a post', async () => {
    // ...
  });
});
```

### 3. 커밋

```bash
git add [파일들]
git commit -m "feat: 설명 (#이슈번호)"
```

**커밋 타입:**

| 타입       | 용도           |
| ---------- | -------------- |
| `feat`     | 새 기능        |
| `fix`      | 버그 수정      |
| `refactor` | 리팩토링       |
| `docs`     | 문서           |
| `test`     | 테스트         |
| `chore`    | 기타 작업      |

### 4. 푸시 & PR 생성

```bash
git push -u origin feature/[이슈번호]-[설명]

gh pr create \
  --base development \
  --title "feat: 설명" \
  --body "Closes #이슈번호"
```

### 5. 태스크 파일 이동

```bash
mv .tasks/in-progress/[이슈번호]-[업무-이름].md .tasks/review/
```

### 6. GitHub 프로젝트 스테이터스 변경

```bash
# 스테이터스를 "pr"로 변경
gh project item-edit --project-id PVT_kwHOBCMlP84A0S2R --id [아이템ID] --field-id PVTSSF_lAHOBCMlP84A0S2RzgfGy-Y --option-id 9ef8707a
```

### 7. 브랜치 변경

```bash
git checkout development
```

---

## GitHub 프로젝트 Status ID

| Status      | Option ID  |
| ----------- | ---------- |
| Todo        | `f75ad846` |
| In Progress | `47fc9ee4` |
| pr          | `9ef8707a` |
| Done        | `98236657` |

**Project ID:** `PVT_kwHOBCMlP84A0S2R`
**Status Field ID:** `PVTSSF_lAHOBCMlP84A0S2RzgfGy-Y`

---

## 실행 예시

```bash
# 1. 검증
npx prettier --write .
npm run lint
npx tsc --noEmit
npm run build
npm run test -- --forceExit

# 2. 커밋 & 푸시
git add src/post/
git commit -m "feat: 게시글 페이지네이션 추가 (#45)"
git push -u origin feature/45-post-pagination

# 3. PR 생성
gh pr create \
  --base development \
  --title "feat: 게시글 페이지네이션 추가" \
  --body "Closes #45"

# 4. 태스크 파일 이동
mv .tasks/in-progress/45-post-pagination.md .tasks/review/

# 5. 프로젝트 스테이터스 변경 (pr)
gh project item-edit --project-id PVT_kwHOBCMlP84A0S2R --id PVTI_xxxx --field-id PVTSSF_lAHOBCMlP84A0S2RzgfGy-Y --option-id 9ef8707a

# 6. 브랜치 변경
git checkout development
```

---

## 출력물

- 모든 검증 통과
- 테스트 코드 (필요시)
- 커밋 완료
- PR 생성 (development 브랜치로)
- 태스크 파일 `.tasks/review/`로 이동
- GitHub 프로젝트 스테이터스 "pr"로 변경
- 현재 브랜치 development로 변경

---

## 금지사항

- 검증 실패 상태로 푸시 금지
- `--force` 푸시 금지
- `.env`, credentials 커밋 금지
- main 브랜치로 PR 금지 (development로만)

---

## 주의사항

- 검증 실패 시 04-developer 에이전트에게 수정 요청
- PR 생성 후 반드시 브랜치를 development로 변경
- 태스크 파일 이동 및 프로젝트 스테이터스 변경 필수
