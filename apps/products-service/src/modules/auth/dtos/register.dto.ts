import { UserRole } from '@repo/shared';
import { IsEnum, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role?: UserRole;
}
