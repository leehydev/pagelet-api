# Pagelet API

블로그/사이트 빌더 플랫폼 "Pagelet"의 백엔드 API입니다.

## 기술 스택

- **프레임워크**: NestJS 11
- **언어**: TypeScript 5.7 (ES2023 타겟)
- **데이터베이스**: PostgreSQL + TypeORM 0.3
- **캐시/락**: Redis (ioredis)
- **스토리지**: AWS S3
- **인증**: JWT + OAuth (Google 등)
- **문서화**: Swagger

## 프로젝트 구조

```
src/
├── auth/           # 인증 (JWT, OAuth, Guards, Decorators)
├── category/       # 카테고리 도메인
├── common/         # 공통 유틸리티 (exception, redis, response)
├── config/         # 환경설정 (DB, JWT, S3 등)
├── database/       # TypeORM 설정, 마이그레이션
├── onboarding/     # 온보딩 플로우
├── post/           # 게시글 도메인
├── site/           # 사이트 도메인
└── storage/        # 파일 업로드, 브랜딩 에셋
```

## 개발 명령어

```bash
# 로컬 개발 (AWS 프로필 사용)
npm run local

# 마이그레이션 생성/실행
npm run migration:generate -- src/database/migrations/AddNewColumn
npm run migration:run

# 테스트
npm run test
npm run test:e2e
```

## 코드 스타일

- Prettier: 작은따옴표, 세미콜론, 100자, 탭 2칸
- ESLint: typescript-eslint 권장 설정

## 핵심 규칙

1. **DB enum 사용 금지** - TypeScript const object + type으로 대체
2. **UUID 사용** - 모든 Primary Key
3. **timestamptz 사용** - 날짜 컬럼은 timezone aware
4. **소스 코드 규칙** - `src/claude.md` 참조

## GitHub 칸반 보드 작업 관리

이 프로젝트는 GitHub 프로젝트의 칸반 보드를 사용하여 작업을 관리합니다.

- 프로젝트 URL: https://github.com/users/leehydev/projects/1/views/1

### 작업 워크플로우 요약

1. **작업 계획 제시 및 승인** → 사용자 검토 및 승인
2. **GitHub 이슈 생성** → 이슈 번호 확인
3. **작업 시작** → 브랜치 생성 + 이슈를 프로젝트에 연결 + 스테이터스 "In Progress"로 변경
4. **작업 진행** → 코드 작성 및 커밋 (커밋 메시지에 이슈 번호 포함)
5. **작업 완료** → PR 생성 + PR을 프로젝트에 연결 + 스테이터스 "pr"로 변경
6. **PR 머지 완료** → 스테이터스 "Done"으로 변경

### 작업 워크플로우

#### 1. 작업 시작 전 검토 단계

**에이전트는 다음 작업을 수행하기 전에 반드시 사용자에게 검토를 요청해야 합니다:**

1. **작업 계획 제시**
   - 작업 목적과 범위를 명확히 설명
   - 예상 작업 단계를 나열
   - 영향받는 파일/모듈 목록 제시
   - 예상 소요 시간 추정

2. **사용자 승인 대기**
   - 작업 계획을 제시한 후, 사용자의 명시적 승인을 기다립니다
   - 승인 없이는 코드 변경을 시작하지 않습니다
   - 사용자가 수정 요청을 하면 계획을 업데이트하고 다시 승인을 요청합니다

3. **승인 후 작업 시작**
   - 사용자 승인 후에만 실제 코드 작업을 시작합니다

#### 2. GitHub 이슈 생성

**작업을 시작하기 전에 반드시 GitHub 이슈를 생성해야 합니다:**

1. **이슈 생성 요청**
   - 작업 계획이 승인되면, 사용자에게 GitHub 이슈 생성을 요청합니다
   - 이슈 제목: 작업 내용을 명확히 표현
   - 이슈 본문:
     - 작업 목적
     - 작업 범위
     - 예상 단계
     - 관련 파일/모듈
     - 완료 기준 (Definition of Done)

2. **이슈 번호 확인**
   - 이슈가 생성되면 이슈 번호를 확인하고
   - 작업 중 이슈 번호를 참조합니다 (예: "이슈 #123 작업 중")

#### 3. 작업 시작: 브랜치 생성 및 스테이터스 변경

**작업을 시작할 때 다음 단계를 수행합니다:**

1. **브랜치 생성**
   - 브랜치명 규칙: `feature/issue-{이슈번호}-{간단한-설명}` 또는 `fix/issue-{이슈번호}-{간단한-설명}`
   - 예: `feature/issue-26-github-kanban-integration`
   - 현재 브랜치에서 새 브랜치를 생성하고 체크아웃

2. **이슈를 프로젝트에 연결 (아직 연결되지 않은 경우)**
   - GitHub GraphQL API를 사용하여 이슈를 프로젝트에 추가

3. **스테이터스를 "In Progress"로 변경**
   - 프로젝트 ID: `PVT_kwHODhZUJs4BNL9F`
   - Status 필드 ID: `PVTSSF_lAHODhZUJs4BNL9Fzg8QUyw`
   - "In Progress" 옵션 ID: `47fc9ee4`

4. **작업 시작 알림**
   - 사용자에게 브랜치 생성 및 스테이터스 변경 완료를 알림

#### 4. 작업 진행 중

- 주요 마일스톤 달성 시 사용자에게 진행 상황 보고
- 필요시 중간 검토 요청
- 커밋 메시지에 이슈 번호 포함 (예: `feat: 이슈 #26 작업 중`)

#### 5. 작업 완료: PR 생성 및 스테이터스 변경

**작업이 완료되면 다음 단계를 수행합니다:**

1. **PR 생성**
   - PR 제목: `[이슈 #XX] 작업 제목`
   - PR 본문:
     - 이슈 번호 참조: `Closes #XX` 또는 `Related to #XX`
     - 작업 내용 요약
     - 변경 사항 설명
     - 테스트 방법 (필요한 경우)
   - base 브랜치: `main` (또는 기본 브랜치)
   - head 브랜치: 작업한 브랜치

2. **PR을 프로젝트에 연결**
   - PR 생성 후 PR의 node ID를 조회
   - GitHub GraphQL API를 사용하여 PR을 프로젝트에 추가
   - PR이 자동으로 이슈와 연결됨 (PR 본문에 이슈 번호가 포함된 경우)
   - PR을 프로젝트에 추가하면 "Linked pull requests" 필드에 자동으로 표시됨

3. **이슈 스테이터스를 "pr"로 변경**
   - "pr" 옵션 ID: `9ef8707a`
   - PR이 생성되었음을 나타냄

4. **PR 생성 알림**
   - 사용자에게 PR 생성 및 스테이터스 변경 완료를 알림
   - PR URL 제공

#### 6. PR 머지 완료: 최종 스테이터스 변경

**PR이 머지되면 (또는 사용자가 완료를 확인하면):**

1. **이슈 스테이터스를 "Done"으로 변경**
   - "Done" 옵션 ID: `98236657`
   - 작업이 완전히 완료되었음을 나타냄

2. **완료 알림**
   - 사용자에게 작업 완료를 알림
   - 이슈 번호 포함 (예: "이슈 #26 완료")

#### 7. 작업 중단/보류 시

- 작업이 중단되거나 보류되면 이슈를 "Todo" 상태로 되돌림
- 중단 사유를 이슈에 코멘트로 기록

### 작업 계획 템플릿

에이전트가 작업 계획을 제시할 때 다음 형식을 사용합니다:

```markdown
## 작업 계획: [작업 제목]

### 목적

[작업의 목적과 배경]

### 작업 범위

- [ ] 작업 항목 1
- [ ] 작업 항목 2
- [ ] 작업 항목 3

### 영향받는 파일/모듈

- `src/path/to/file.ts`
- `src/another/path.ts`

### 예상 소요 시간

약 X시간

### 완료 기준

- [ ] 기준 1
- [ ] 기준 2

### GitHub 이슈

- 이슈 번호: #XXX (생성 예정)
```

### 예외 상황

다음의 경우에는 검토 없이 진행할 수 있습니다:

1. **명확한 요청**
   - 사용자가 "이 파일을 수정해줘"처럼 명확하고 구체적인 요청을 한 경우
   - 작업 범위가 매우 작고 단순한 경우 (예: 오타 수정, 간단한 주석 추가)

2. **긴급 수정**
   - 사용자가 명시적으로 긴급 수정을 요청한 경우
   - 단, 수정 후 반드시 이슈를 생성하고 보고해야 합니다

### GitHub 프로젝트 정보

- **프로젝트 URL**: https://github.com/users/leehydev/projects/1/views/1
- **프로젝트 ID**: `PVT_kwHODhZUJs4BNL9F`
- **Status 필드 ID**: `PVTSSF_lAHODhZUJs4BNL9Fzg8QUyw`
- **Status 옵션**:
  - Todo: `f75ad846`
  - In Progress: `47fc9ee4`
  - pr: `9ef8707a`
  - Done: `98236657`

### GitHub API 사용 예시

#### 이슈를 프로젝트에 연결

```bash
gh api graphql -f query='mutation { addProjectV2ItemById(input: {projectId: "PVT_kwHODhZUJs4BNL9F" contentId: "I_이슈ID"}) { item { id } } }'
```

#### 이슈 스테이터스 변경

```bash
gh api graphql -f query='mutation { updateProjectV2ItemFieldValue(input: {projectId: "PVT_kwHODhZUJs4BNL9F" itemId: "PVTI_아이템ID" fieldId: "PVTSSF_lAHODhZUJs4BNL9Fzg8QUyw" value: {singleSelectOptionId: "47fc9ee4"}}) { projectV2Item { id } } }'
```

#### PR의 node ID 조회

```bash
gh api graphql -f query='query { repository(owner: "leehydev", name: "pagelet-api") { pullRequest(number: PR번호) { id title } } }'
```

#### PR을 프로젝트에 연결

```bash
gh api graphql -f query='mutation { addProjectV2ItemById(input: {projectId: "PVT_kwHODhZUJs4BNL9F" contentId: "PR_노드ID"}) { item { id } } }'
```

#### 이슈의 프로젝트 아이템 ID 조회 (스테이터스 변경용)

```bash
gh api graphql -f query='query { node(id: "PVT_kwHODhZUJs4BNL9F") { ... on ProjectV2 { items(first: 100) { nodes { id content { ... on Issue { number title } } } } } } }'
```

### 참고사항

- 모든 작업은 이슈와 연결되어 추적 가능해야 합니다
- 작업 계획은 명확하고 구체적이어야 합니다
- 사용자와의 소통을 최우선으로 합니다
- 불확실한 부분은 반드시 사용자에게 확인합니다
- 브랜치명은 이슈 번호를 포함하여 추적 가능하도록 합니다
- PR은 반드시 이슈와 연결되어야 합니다
- 스테이터스 변경은 각 단계에서 자동으로 수행됩니다

## 서브 에이전트

에이전트 정의는 `.claude/agents/` 참조:

| 에이전트 | 파일 | 역할 |
|---------|------|------|
| Architect | `.claude/agents/architect.md` | 요구사항 분석, 이슈 생성, 태스크 파일 정의 |
| Developer | `.claude/agents/developer.md` | 태스크 구현, 빌드/테스트, PR 생성 |

### 협업 흐름

```
사용자 요청 → [Architect] → 이슈 + 태스크(backlog/)
    ↓
사용자 승인 → [Developer] → 구현 + PR + 태스크(review/)
    ↓
PR 머지 → 태스크(done/)
```
