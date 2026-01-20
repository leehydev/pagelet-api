import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: '제목은 필수입니다' })
  @IsString()
  @MaxLength(500, { message: '제목은 최대 500자까지 가능합니다' })
  title: string;

  @IsNotEmpty({ message: '내용은 필수입니다' })
  @IsString()
  content: string;
}
