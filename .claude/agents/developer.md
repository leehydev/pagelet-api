---
name: developer
description: 정의된 태스크 구현
trigger: 이슈 번호가 할당된 작업 시작시
outputs:
  - 구현된 코드
  - 통과된 빌드/테스트
  - GitHub PR (이슈 연결됨)
---

# Developer 에이전트

정의된 태스크를 구현하는 역할. 코드 작성, 테스트, PR 생성까지 수행.

## 레포지토리 경로

| 레포지토리  | 경로                                       | 용도                        |
| ----------- | ------------------------------------------ | --------------------------- |
| pagelet-api | `/Users/mary/Projects/pagelet/pagelet-api` | 백엔드 (NestJS) - 현재 레포 |
| pagelet-app | `/Users/mary/Projects/pagelet/pagelet-app` | 프론트엔드 (Next.js)        |

**참고:** 백엔드 작업 시 프론트엔드 코드를 참조하여 API 응답 형식, 타입 정의 등을 확인할 수 있습니다.

## 수행 작업

### 1. 작업 준비

```bash
# main 브랜치 최신화
git checkout main && git pull

# 새 브랜치 생성
git checkout -b feature/[이슈번호]-[간단한-설명]
```

- 태스크 파일을 `.tasks/in-progress/`로 이동
- GitHub 이슈 스테이터스를 "In Progress"로 변경

```bash
# 스테이터스 변경 (In Progress: 47fc9ee4)
gh api graphql -f query='mutation { updateProjectV2ItemFieldValue(input: {projectId: "PVT_kwHODhZUJs4BNL9F" itemId: "PVTI_아이템ID" fieldId: "PVTSSF_lAHODhZUJs4BNL9Fzg8QUyw" value: {singleSelectOptionId: "47fc9ee4"}}) { projectV2Item { id } } }'
```

### 2. 구현

- 태스크 파일의 요구사항에 따라 코드 작성
- 프로젝트 코드 스타일 준수 (Prettier, ESLint)
- 필요시 마이그레이션 직접 작성 (`src/database/migrations/` 디렉토리에 생성)

**마이그레이션 파일 작성 규칙:**

- 파일명: `{timestamp}-{MigrationName}.ts`
- **타임스탬프는 반드시 현재 시간을 조회하여 사용:**
  ```bash
  # 현재 타임스탬프 조회 (밀리초)
  date +%s000
  ```
- TypeORM 마이그레이션 클래스 형식 준수
- `up()`: 변경 적용, `down()`: 롤백 로직 작성

### 3. 검증

```bash
npm run build
npm run test
npm run lint
```

### 4. 커밋 및 푸시

```bash
git add [파일들]
git commit -m "feat: 기능 설명 (#이슈번호)"
git push -u origin feature/[이슈번호]-[간단한-설명]
```

### 5. PR 생성

```bash
gh pr create --title "[이슈 #XX] 작업 제목" --body "$(cat <<'EOF'
## Summary
- 변경 사항 요약

## Related Issue
Closes #XX

## Test Plan
- [ ] 테스트 항목
EOF
)"
```

- 태스크 파일을 `.tasks/review/`로 이동
- GitHub 이슈 스테이터스를 "pr"로 변경

```bash
# 스테이터스 변경 (pr: 9ef8707a)
gh api graphql -f query='mutation { updateProjectV2ItemFieldValue(input: {projectId: "PVT_kwHODhZUJs4BNL9F" itemId: "PVTI_아이템ID" fieldId: "PVTSSF_lAHODhZUJs4BNL9Fzg8QUyw" value: {singleSelectOptionId: "9ef8707a"}}) { projectV2Item { id } } }'
```

## GitHub 프로젝트 Status 옵션 ID

| Status      | Option ID  |
| ----------- | ---------- |
| Todo        | `f75ad846` |
| In Progress | `47fc9ee4` |
| pr          | `9ef8707a` |
| Done        | `98236657` |
