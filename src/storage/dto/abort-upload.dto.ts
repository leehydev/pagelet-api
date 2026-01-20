import { IsNotEmpty, IsString } from 'class-validator';

export class AbortUploadDto {
  @IsNotEmpty({ message: 'S3 Key는 필수입니다' })
  @IsString()
  s3Key: string;
}
