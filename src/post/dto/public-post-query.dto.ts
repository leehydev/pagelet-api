import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 공개 게시글 목록 조회 쿼리 DTO
 */
export class PublicPostListQueryDto {
  @ApiProperty({ description: '사이트 slug' })
  @IsString()
  siteSlug: string;

  @ApiPropertyOptional({ description: '카테고리 slug (필터)' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({
    description: '현재 페이지 (1부터 시작)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}

/**
 * 공개 게시글 상세 조회 쿼리 DTO
 */
export class PublicPostDetailQueryDto {
  @ApiProperty({ description: '사이트 slug' })
  @IsString()
  siteSlug: string;

  @ApiPropertyOptional({
    description: '카테고리 slug (인접 게시글 조회 범위 지정)',
  })
  @IsOptional()
  @IsString()
  categorySlug?: string;
}
