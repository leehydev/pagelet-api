# [BE] 크로스 도메인 인증 방식 변경

## GitHub 이슈

- **이슈 번호**: #79
- **이슈 링크**: https://github.com/leehydev/pagelet-api/issues/79
- **생성일**: 2026-01-25
- **우선순위**: 높음
- **관련 태스크**: pagelet-app #78

## 개요

백엔드 도메인이 `api.pagelet.kr`에서 `pagelet-api.kr`로 변경됨에 따라 프론트엔드(`*.pagelet.kr`)와 쿠키 공유가 불가능해졌습니다.

**변경 방향:**

- accessToken: 클라이언트 localStorage + Authorization 헤더
- refreshToken: 프론트 서버 httpOnly 쿠키 → 백엔드에 Authorization 헤더로 전달

## 작업 범위

### 1. OAuth 콜백 응답 방식 변경

```typescript
// 기존
CookieUtil.setAccessTokenCookie(res, tokens.accessToken);
CookieUtil.setRefreshTokenCookie(res, tokens.refreshToken);
res.redirect(`${frontendUrl}/auth/success`);

// 변경
const callbackUrl = new URL(`${frontendUrl}/api/auth/callback`);
callbackUrl.searchParams.set('accessToken', tokens.accessToken);
callbackUrl.searchParams.set('refreshToken', tokens.refreshToken);
res.redirect(callbackUrl.toString());
```

### 2. Refresh 엔드포인트 헤더 지원

```typescript
// 기존
const refreshToken = req.cookies.refresh_token;

// 변경: 헤더 우선, 쿠키 fallback
const refreshToken = req.headers.authorization?.replace('Bearer ', '') || req.cookies.refresh_token;

// 헤더 요청 시 JSON 응답
return res.json({ accessToken: result.accessToken });
```

## 영향받는 파일

- `src/auth/auth.controller.ts` (OAuth 콜백, refresh 엔드포인트)
- `src/auth/utils/cookie.util.ts`

## 구현 체크리스트

- [ ] Kakao OAuth 콜백 수정
- [ ] Naver OAuth 콜백 수정
- [ ] Refresh 엔드포인트 Authorization 헤더 지원
- [ ] JSON 응답으로 accessToken 반환
- [ ] 기존 쿠키 방식도 유지 (하위 호환)

## 테스트 계획

- [ ] Kakao 로그인 → 토큰 쿼리 파라미터 전달 확인
- [ ] Naver 로그인 → 토큰 쿼리 파라미터 전달 확인
- [ ] Authorization 헤더로 refresh 요청 → JSON 응답 확인
- [ ] 쿠키로 refresh 요청 → 기존 방식 동작 확인
