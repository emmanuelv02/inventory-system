import { UserRole } from './user-role.enum';

export interface TokenPayload {
  sub: string;
  role: UserRole;
}
