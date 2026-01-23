/**
 * 대기자 목록 응답 DTO
 */
export class WaitlistUserResponseDto {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: Date;

  constructor(partial: Partial<WaitlistUserResponseDto>) {
    Object.assign(this, partial);
  }
}
