import { IsString, IsNumber, Min, Max } from 'class-validator';

export class BannerPresignDto {
  @IsString({ message: '파일명은 문자열이어야 합니다' })
  filename: string;

  @IsNumber({}, { message: '파일 크기는 숫자여야 합니다' })
  @Min(1, { message: '파일 크기는 1바이트 이상이어야 합니다' })
  @Max(5 * 1024 * 1024, { message: '파일 크기는 최대 5MB까지 가능합니다' })
  size: number;

  @IsString({ message: 'MIME 타입은 문자열이어야 합니다' })
  mimeType: string;
}

export class BannerPresignResponseDto {
  uploadUrl: string;
  publicUrl: string;

  constructor(partial: Partial<BannerPresignResponseDto>) {
    Object.assign(this, partial);
  }
}
