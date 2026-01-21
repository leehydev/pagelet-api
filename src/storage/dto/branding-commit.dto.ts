import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BrandingType } from './branding-presign.dto';

export class BrandingCommitDto {
  @ApiProperty({
    description: '브랜딩 타입',
    enum: ['logo', 'favicon', 'og'],
    example: 'logo',
  })
  @IsEnum(BrandingType)
  type: BrandingType;

  @ApiProperty({
    description: '임시 S3 Key',
    example: 'uploads/sites/uuid/branding/tmp/logo_1234567890.png',
  })
  @IsString()
  tmpKey: string;
}
