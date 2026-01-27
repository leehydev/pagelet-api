# [BE] 네이버 소셜 로그인 API 구현

## GitHub 이슈

- **이슈 번호**: #45
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/45
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-app#52 (프론트엔드 UI)

## 개요

네이버 소셜 로그인 기능을 백엔드 API에 추가합니다. 기존 Google OAuth 구현 패턴을 따라 일관성 있게 구현합니다.

## 작업 범위

### 포함

- BE-1: `OAuthProvider`에 `NAVER` 추가
- BE-2: 네이버 OAuth DTO 생성 (token, user-info)
- BE-3: `NaverOAuthClient` 구현
- BE-4: `NaverOAuthService` 구현
- BE-5: `OAuthModule`에 Provider 등록
- BE-6: `AuthController`에 엔드포인트 추가 (`/auth/naver`, `/auth/naver/callback`)
- BE-7: `AuthService`에 `loginWithNaver()` 추가
- BE-8: 환경변수 추가
- BE-9: 단위 테스트 작성

### 제외

- 프론트엔드 UI 구현 (pagelet-app#52에서 처리)

## 기술 명세

### 네이버 OAuth 2.0 API

- 인증 URL: `https://nid.naver.com/oauth2.0/authorize`
- 토큰 URL: `https://nid.naver.com/oauth2.0/token`
- 사용자 정보 URL: `https://openapi.naver.com/v1/nid/me`

### API 엔드포인트

| Method | Path                   | 설명                              |
| ------ | ---------------------- | --------------------------------- |
| GET    | `/auth/naver`          | 네이버 로그인 페이지로 리다이렉트 |
| GET    | `/auth/naver/callback` | 콜백 처리 및 JWT 발급             |

### 영향받는 파일

- `src/auth/constants/oauth-provider.ts` - Provider 상수 추가
- `src/auth/oauth/naver/naver-oauth.client.ts` - 신규
- `src/auth/oauth/naver/naver-oauth.service.ts` - 신규
- `src/auth/oauth/naver/dto/naver-token.dto.ts` - 신규
- `src/auth/oauth/naver/dto/naver-user-info.dto.ts` - 신규
- `src/auth/oauth/naver/index.ts` - 신규
- `src/auth/oauth/oauth.module.ts` - Provider 등록
- `src/auth/auth.controller.ts` - 엔드포인트 추가
- `src/auth/auth.service.ts` - loginWithNaver() 추가
- `.env.example` - 환경변수 문서화

### 환경변수

```
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_CALLBACK_URL=
```

### 네이버 사용자 정보 응답 형식

```json
{
  "resultcode": "00",
  "message": "success",
  "response": {
    "id": "32742776",
    "email": "user@example.com",
    "name": "홍길동",
    "profile_image": "https://..."
  }
}
```

## 구현 체크리스트

### BE-1: OAuthProvider 추가

- [ ] `src/auth/constants/oauth-provider.ts`에 `NAVER` 추가

### BE-2: DTO 생성

- [ ] `naver-token.dto.ts` - 토큰 응답 DTO
- [ ] `naver-user-info.dto.ts` - 사용자 정보 응답 DTO

### BE-3: NaverOAuthClient 구현

- [ ] 토큰 교환 메서드
- [ ] 사용자 정보 조회 메서드
- [ ] 에러 핸들링

### BE-4: NaverOAuthService 구현

- [ ] 인증 URL 생성
- [ ] 콜백 처리
- [ ] 사용자 정보 매핑

### BE-5: OAuthModule 등록

- [ ] NaverOAuthClient Provider 등록
- [ ] NaverOAuthService Provider 등록

### BE-6: AuthController 엔드포인트

- [ ] `GET /auth/naver` 엔드포인트
- [ ] `GET /auth/naver/callback` 엔드포인트
- [ ] Swagger 문서화

### BE-7: AuthService 메서드

- [ ] `loginWithNaver()` 메서드 추가
- [ ] 기존 사용자 연동 로직
- [ ] 신규 사용자 생성 로직

### BE-8: 환경변수

- [ ] `.env.example` 업데이트
- [ ] ConfigService 타입 추가 (필요시)

### BE-9: 테스트

- [ ] NaverOAuthClient 단위 테스트
- [ ] NaverOAuthService 단위 테스트
- [ ] AuthController 통합 테스트

## 테스트 계획

### 단위 테스트

- NaverOAuthClient
  - 토큰 교환 성공/실패
  - 사용자 정보 조회 성공/실패
- NaverOAuthService
  - 인증 URL 생성
  - 콜백 처리

### 통합 테스트

- 전체 OAuth 플로우 (mock 사용)

## 참고 자료

- [네이버 로그인 API 명세](https://developers.naver.com/docs/login/api/api.md)
- [네이버 개발자 센터](https://developers.naver.com/)
- 기존 Google OAuth 구현: `src/auth/oauth/google/`
