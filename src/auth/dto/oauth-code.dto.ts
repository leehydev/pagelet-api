import { IsNotEmpty, IsString } from 'class-validator';

/**
 * OAuth Authorization Code 교환 요청 DTO
 * 프론트엔드에서 OAuth 콜백으로 받은 code를 전달
 */
export class OAuthCodeDto {
  @IsNotEmpty({ message: 'Authorization code는 필수입니다' })
  @IsString()
  code: string;
}
