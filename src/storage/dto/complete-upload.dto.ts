import { IsNotEmpty, IsString, IsOptional, IsUUID, IsIn } from 'class-validator';
import { PostImageType } from '../entities/post-image.entity';

export class CompleteUploadDto {
  @IsNotEmpty({ message: 'S3 Key는 필수입니다' })
  @IsString()
  s3Key: string;

  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(PostImageType), { message: '유효하지 않은 이미지 타입입니다' })
  imageType?: string;
}
