import { IsNotEmpty, IsUrl } from 'class-validator';

export class RequestIndexingDto {
  @IsNotEmpty({ message: 'URL은 필수입니다' })
  @IsUrl({}, { message: '유효한 URL 형식이어야 합니다' })
  url: string;
}
