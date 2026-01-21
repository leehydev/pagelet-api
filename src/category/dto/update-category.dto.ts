import { IsString, MaxLength, IsOptional, Matches } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Slug는 최대 255자까지 가능합니다' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug는 영소문자, 숫자, 하이픈만 사용 가능합니다',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '이름은 최대 255자까지 가능합니다' })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  sortOrder?: number;
}
