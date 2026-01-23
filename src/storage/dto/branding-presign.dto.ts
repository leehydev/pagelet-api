import { IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const BrandingType = {
  LOGO: 'logo',
  FAVICON: 'favicon',
  OG: 'og',
  CTA: 'cta',
} as const;

export type BrandingType = (typeof BrandingType)[keyof typeof BrandingType];

export class BrandingPresignDto {
  @ApiProperty({
    description: '브랜딩 타입',
    enum: ['logo', 'favicon', 'og', 'cta'],
    example: 'logo',
  })
  @IsEnum(BrandingType)
  type: BrandingType;

  @ApiProperty({
    description: '원본 파일명',
    example: 'my-logo.png',
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: '파일 크기 (bytes)',
    example: 102400,
  })
  @IsNumber()
  @Min(1)
  @Max(5 * 1024 * 1024) // 5MB
  size: number;

  @ApiProperty({
    description: 'MIME 타입',
    example: 'image/png',
  })
  @IsString()
  mimeType: string;
}
