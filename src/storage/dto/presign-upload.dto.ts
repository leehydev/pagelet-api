import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUUID, Max, IsIn } from 'class-validator';
import { PostImageType } from '../entities/post-image.entity';

export class PresignUploadDto {
  @IsNotEmpty({ message: '파일명은 필수입니다' })
  @IsString()
  filename: string;

  @IsNotEmpty({ message: '파일 크기는 필수입니다' })
  @IsNumber()
  @Max(2097152, { message: '파일 크기는 최대 2MB까지 가능합니다' }) // 2MB
  size: number;

  @IsNotEmpty({ message: 'MIME 타입은 필수입니다' })
  @IsString()
  mimeType: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(PostImageType), { message: '유효하지 않은 이미지 타입입니다' })
  imageType?: string;

  @IsOptional()
  @IsUUID()
  postId?: string;
}
