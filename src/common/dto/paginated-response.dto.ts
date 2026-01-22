import { ApiProperty } from '@nestjs/swagger';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '데이터 목록', isArray: true })
  items: T[];

  @ApiProperty({
    description: '페이지네이션 메타데이터',
    example: {
      page: 1,
      limit: 10,
      totalItems: 50,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  })
  meta: PaginationMeta;

  constructor(items: T[], meta: PaginationMeta) {
    this.items = items;
    this.meta = meta;
  }

  static create<T>(
    items: T[],
    totalItems: number,
    page: number,
    limit: number,
  ): PaginatedResponseDto<T> {
    const totalPages = Math.ceil(totalItems / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
    return new PaginatedResponseDto(items, meta);
  }
}
