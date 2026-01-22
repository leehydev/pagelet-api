import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNumber,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateBannerDto {
  @IsOptional()
  @IsString({ message: '이미지 URL은 문자열이어야 합니다' })
  @MaxLength(500, { message: '이미지 URL은 최대 500자까지 가능합니다' })
  imageUrl?: string;

  @IsOptional()
  @IsString({ message: '링크 URL은 문자열이어야 합니다' })
  @MaxLength(500, { message: '링크 URL은 최대 500자까지 가능합니다' })
  @Matches(/^https?:\/\//, { message: 'http 또는 https URL만 허용됩니다' })
  linkUrl?: string | null;

  @IsOptional()
  @IsBoolean({ message: '새 탭에서 열기 값은 불리언이어야 합니다' })
  openInNewTab?: boolean;

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

  @IsOptional()
  @IsString({ message: '대체 텍스트는 문자열이어야 합니다' })
  @MaxLength(255, { message: '대체 텍스트는 최대 255자까지 가능합니다' })
  altText?: string | null;
}
