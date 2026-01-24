/**
 * 시스템 설정 응답 DTO
 */
export class SystemSettingResponseDto {
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;

  constructor(partial: Partial<SystemSettingResponseDto>) {
    Object.assign(this, partial);
  }
}
