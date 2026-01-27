import { IsNotEmpty, IsString, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';

export class CreateReservedSlugDto {
  @IsNotEmpty({ message: 'slug는 필수입니다' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
    message: 'slug는 영소문자, 숫자, 하이픈만 사용할 수 있습니다',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  adminOnly?: boolean;
}
