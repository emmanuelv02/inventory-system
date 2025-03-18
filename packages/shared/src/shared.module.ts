import {Module} from '@nestjs/common';
import {CacheModule} from './modules/cache';
import {APP_GUARD} from '@nestjs/core';
import {RolesGuard} from './modules/auth/guards/roles.guard';
import {AuthModule} from './modules/auth/auth.module';
import { JwtGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [CacheModule, AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [],
})
export class SharedModule {}
