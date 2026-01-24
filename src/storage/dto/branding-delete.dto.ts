import { ApiProperty } from '@nestjs/swagger';
import { BrandingType } from './branding-presign.dto';

export class BrandingDeleteResponseDto {
  @ApiProperty({
    description: '삭제 성공 여부',
    example: true,
  })
  deleted: boolean;

  @ApiProperty({
    description: '삭제된 브랜딩 타입',
    enum: ['logo', 'favicon', 'og', 'cta'],
    example: 'logo',
  })
  type: BrandingType;

  @ApiProperty({
    description: '업데이트 시간',
    example: '2026-01-24T10:00:00.000Z',
  })
  updatedAt: string;
}
