import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackCtaClickDto {
  @IsUUID('4', { message: 'siteId는 유효한 UUID여야 합니다' })
  siteId: string;

  @IsOptional()
  @IsUUID('4', { message: 'postId는 유효한 UUID여야 합니다' })
  postId?: string;

  @IsString({ message: 'visitorId는 문자열이어야 합니다' })
  @MaxLength(64, { message: 'visitorId는 최대 64자까지 가능합니다' })
  visitorId: string;
}
