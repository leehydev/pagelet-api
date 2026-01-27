export class ReservedSlugResponseDto {
  id: string;
  slug: string;
  reason: string | null;
  adminOnly: boolean;
  createdAt: Date;

  constructor(partial: Partial<ReservedSlugResponseDto>) {
    Object.assign(this, partial);
  }
}
