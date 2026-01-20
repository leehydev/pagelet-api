import { IsNotEmpty, IsString, IsEmail, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsNotEmpty({ message: '이름은 필수입니다' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @MaxLength(255)
  email: string;
}
