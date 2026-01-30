export class IndexingResponseDto {
  url: string;
  type: string;
  notifyTime: string;

  constructor(partial: Partial<IndexingResponseDto>) {
    Object.assign(this, partial);
  }
}
