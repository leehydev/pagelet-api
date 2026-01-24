import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostDraftResponseDto {
  @ApiProperty({ description: '드래프트 ID' })
  id: string;

  @ApiProperty({ description: '게시글 ID' })
  postId: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '부제목' })
  subtitle: string;

  @ApiProperty({ description: 'Slug (URL 경로)' })
  slug: string;

  @ApiPropertyOptional({ description: 'Tiptap 에디터 JSON 데이터' })
  contentJson: Record<string, any> | null;

  @ApiPropertyOptional({ description: '렌더링용 HTML' })
  contentHtml: string | null;

  @ApiPropertyOptional({ description: '검색/미리보기용 텍스트' })
  contentText: string | null;

  @ApiPropertyOptional({ description: 'SEO 제목' })
  seoTitle: string | null;

  @ApiPropertyOptional({ description: 'SEO 설명' })
  seoDescription: string | null;

  @ApiPropertyOptional({ description: 'OG 이미지 URL' })
  ogImageUrl: string | null;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  categoryId: string | null;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  constructor(partial: Partial<PostDraftResponseDto>) {
    Object.assign(this, partial);
  }
}
