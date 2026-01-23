/**
 * Naver 사용자 정보 응답 DTO
 * 참고: https://developers.naver.com/docs/login/api/api.md
 */
export class NaverUserResponseDto {
  id: string;
  email?: string;
  name?: string;
  profile_image?: string;
  nickname?: string;
  age?: string;
  gender?: string;
  birthday?: string;
  birthyear?: string;
  mobile?: string;
}

export class NaverUserInfoDto {
  resultcode: string;
  message: string;
  response: NaverUserResponseDto;
}
