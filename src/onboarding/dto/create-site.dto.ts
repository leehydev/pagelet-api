import { IsNotEmpty, IsString, MaxLength, Matches, MinLength } from 'class-validator';

export class CreateSiteDto {
  @IsNotEmpty({ message: '사이트 이름은 필수입니다' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty({ message: 'slug는 필수입니다' })
  @IsString()
  @MinLength(3, { message: 'slug는 최소 3자 이상이어야 합니다' })
  @MaxLength(50, { message: 'slug는 최대 50자까지 가능합니다' })
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
    message: 'slug는 영소문자, 숫자, 하이픈만 사용할 수 있습니다',
  })
  slug: string;
}
