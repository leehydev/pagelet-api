/**
 * 사용자 정보 응답 DTO
 */
export class UserResponseDto {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
