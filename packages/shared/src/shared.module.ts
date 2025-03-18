import {Module} from '@nestjs/common';
import {CacheModule} from './modules/cache';
import {APP_GUARD} from '@nestjs/core';
import {JwtAuthGuard} from './modules/auth/guards/jwt-auth.guard';
import {RolesGuard} from './modules/auth/guards/roles.guard';
import {AuthModule} from './modules/auth/auth.module';

@Module({
  imports: [CacheModule, AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [],
})
export class SharedModule {}
