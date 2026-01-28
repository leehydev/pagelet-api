import { IsString, IsIn, IsNotEmpty } from 'class-validator';
import { PostStatus } from '../entities/post.entity';

export class UpdatePostStatusDto {
  @IsNotEmpty({ message: '상태는 필수입니다' })
  @IsString()
  @IsIn(Object.values(PostStatus), { message: 'status는 PRIVATE 또는 PUBLISHED만 가능합니다' })
  status: string;
}
