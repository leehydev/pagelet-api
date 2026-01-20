/**
 * 로그인 응답 DTO
 */
export class LoginResponseDto {
  userId: string;
  email: string | null;
  name: string | null;
  accessToken: string;
  refreshToken: string;
}
