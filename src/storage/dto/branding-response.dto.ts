import { ApiProperty } from '@nestjs/swagger';

export class BrandingPresignResponseDto {
  @ApiProperty({
    description: 'Presigned URL (PUT 업로드용)',
    example: 'https://s3.amazonaws.com/bucket/...',
  })
  uploadUrl: string;

  @ApiProperty({
    description: '임시 Public URL (미리보기용)',
    example: 'https://assets.pagelet.kr/uploads/sites/uuid/branding/tmp/logo_123.png',
  })
  tmpPublicUrl: string;

  @ApiProperty({
    description: '임시 S3 Key (commit 시 사용)',
    example: 'uploads/sites/uuid/branding/tmp/logo_1234567890.png',
  })
  tmpKey: string;
}

export class BrandingCommitResponseDto {
  @ApiProperty({
    description: '최종 Public URL',
    example: 'https://assets.pagelet.kr/uploads/sites/uuid/branding/logo.png',
  })
  publicUrl: string;

  @ApiProperty({
    description: '업데이트 시간 (캐시 버스트용)',
    example: '2025-01-22T10:00:00.000Z',
  })
  updatedAt: string;
}
