import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {UserRole} from '../models/user-role.enum';
import {IS_PUBLIC_KEY} from '../models/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const {user} = context.switchToHttp().getRequest();

    return requiredRoles.some(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (role) => user.role === role || user.role === UserRole.ADMIN
    );
  }
}
