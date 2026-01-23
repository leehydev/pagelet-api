import { IsArray, IsUUID } from 'class-validator';

export class UpdateBannerOrderDto {
  @IsArray({ message: '배너 ID 목록은 배열이어야 합니다' })
  @IsUUID('4', { each: true, message: '각 배너 ID는 유효한 UUID여야 합니다' })
  bannerIds: string[];
}
