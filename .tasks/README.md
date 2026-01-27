# 태스크 관리 시스템

이 디렉토리는 프로젝트의 태스크를 파일 기반으로 관리합니다.

## 디렉토리 구조

```
.tasks/
├── README.md           # 이 파일
├── backlog/            # 대기 중인 태스크
├── in-progress/        # 진행 중인 태스크
├── review/             # 리뷰 대기 중인 태스크 (PR 생성됨)
├── done/               # 완료된 태스크
└── templates/          # 태스크 템플릿
```

## 태스크 파일 명명 규칙

```
[이슈번호]-[간단한-설명].md
```

예시: `26-github-kanban-integration.md`

## 워크플로우

1. **Architect**: 요구사항 분석 → 태스크 파일 생성 (`backlog/`)
2. **Developer**: 태스크 시작 → 파일 이동 (`in-progress/`)
3. **Developer**: PR 생성 → 파일 이동 (`review/`)
4. **머지 완료**: 파일 이동 (`done/`)

## 태스크 상태와 디렉토리 매핑

| 디렉토리       | GitHub 프로젝트 Status | 설명         |
| -------------- | ---------------------- | ------------ |
| `backlog/`     | Todo                   | 대기 중      |
| `in-progress/` | In Progress            | 진행 중      |
| `review/`      | pr                     | PR 리뷰 대기 |
| `done/`        | Done                   | 완료         |
