import { IsBoolean, IsNotEmpty } from 'class-validator';

export class SetUserAdminDto {
  @IsNotEmpty({ message: 'isAdmin은 필수입니다' })
  @IsBoolean()
  isAdmin: boolean;
}
