import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * 시스템 설정 변경 DTO
 */
export class UpdateSystemSettingDto {
  @IsNotEmpty({ message: '설정 값은 필수입니다' })
  @IsString()
  @MaxLength(500, { message: '설정 값은 최대 500자까지 가능합니다' })
  value: string;
}
