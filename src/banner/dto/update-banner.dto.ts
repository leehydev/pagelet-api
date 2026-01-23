import { IsUUID, IsOptional, IsBoolean, IsDateString, IsNumber } from 'class-validator';

export class UpdateBannerDto {
  @IsOptional()
  @IsUUID('4', { message: '게시글 ID는 유효한 UUID여야 합니다' })
  postId?: string;

  @IsOptional()
  @IsBoolean({ message: '활성화 값은 불리언이어야 합니다' })
  isActive?: boolean;

  @IsOptional()
  @IsDateString({}, { message: '시작 시간은 ISO 8601 형식이어야 합니다' })
  startAt?: string | null;

  @IsOptional()
  @IsDateString({}, { message: '종료 시간은 ISO 8601 형식이어야 합니다' })
  endAt?: string | null;

  @IsOptional()
  @IsNumber({}, { message: '표시 순서는 숫자여야 합니다' })
  displayOrder?: number;
}
