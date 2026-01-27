# Starter Agent

태스크를 진행중 상태로 변경하고 작업 환경을 준비하는 에이전트입니다.

## 레포지토리

| 레포지토리  | 경로                                       | 용도                 |
| ----------- | ------------------------------------------ | -------------------- |
| pagelet-api | `/Users/mary/Projects/pagelet/pagelet-api` | 백엔드 (NestJS)      |
| pagelet-app | `/Users/mary/Projects/pagelet/pagelet-app` | 프론트엔드 (Next.js) |

---

## 워크플로우

### 1. 태스크 파일 확인

`.tasks/backlog/[이슈번호]-[업무-이름].md` 파일 내용 확인

### 2. 태스크 파일 이동

```bash
mv .tasks/backlog/[이슈번호]-[업무-이름].md .tasks/in-progress/
```

### 3. GitHub 프로젝트 스테이터스 변경

```bash
# 이슈 URL로 프로젝트 아이템 ID 조회
gh project item-list 1 --owner @me --format json | jq '.items[] | select(.content.url == "https://github.com/leehydev/[repo]/issues/[번호]") | .id'

# 스테이터스를 "In Progress"로 변경
gh project item-edit --project-id PVT_kwHOBCMlP84A0S2R --id [아이템ID] --field-id PVTSSF_lAHOBCMlP84A0S2RzgfGy-Y --option-id 47fc9ee4
```

### 4. 브랜치 생성

```bash
git checkout development
git pull origin development
git checkout -b feature/[이슈번호]-[간단한-설명]
```

**브랜치 명명 규칙:**

| 타입      | 패턴                         | 예시                         |
| --------- | ---------------------------- | ---------------------------- |
| 기능 추가 | `feature/[이슈번호]-[설명]`  | `feature/42-post-pagination` |
| 버그 수정 | `fix/[이슈번호]-[설명]`      | `fix/43-login-error`         |
| 리팩토링  | `refactor/[이슈번호]-[설명]` | `refactor/44-api-client`     |

---

## GitHub 프로젝트 Status ID

| Status      | Option ID  |
| ----------- | ---------- |
| Todo        | `f75ad846` |
| In Progress | `47fc9ee4` |
| pr          | `9ef8707a` |
| Done        | `98236657` |

**Project ID:** `PVT_kwHODhZUJs4BNL9F`
**Status Field ID:** `PVTSSF_lAHODhZUJs4BNL9Fzg8QUyw`

---

## 실행 예시

```bash
# 1. 태스크 파일 이동
mv .tasks/backlog/45-user-profile-api.md .tasks/in-progress/

# 2. 프로젝트 아이템 ID 조회
gh project item-list 1 --owner @me --format json | jq '.items[] | select(.content.url == "https://github.com/leehydev/pagelet-api/issues/45") | .id'
# 출력: "PVTI_xxxx"

# 3. 스테이터스 변경
gh project item-edit --project-id PVT_kwHOBCMlP84A0S2R --id PVTI_xxxx --field-id PVTSSF_lAHOBCMlP84A0S2RzgfGy-Y --option-id 47fc9ee4

# 4. 브랜치 생성
git checkout development
git pull origin development
git checkout -b feature/45-user-profile-api
```

---

## 출력물

- 태스크 파일이 `.tasks/in-progress/`로 이동됨
- GitHub 프로젝트 스테이터스가 "In Progress"로 변경됨
- development 기반 feature 브랜치 생성 완료

---

## 주의사항

- 반드시 development 브랜치에서 분기할 것
- 브랜치 생성 전 `git pull` 필수
- 태스크 파일 이동 전 파일 존재 확인
