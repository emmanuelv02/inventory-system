import { Module } from '@nestjs/common';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';
import { CacheModule } from './modules/cache/cache.module';
import { EventsModule } from './modules/events/events.module';
import { AuthModule, JwtAuthGuard, RolesGuard } from '@repo/shared/';
import { APP_GUARD } from '@nestjs/core';
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    InventoryModule,
    CacheModule,
    EventsModule,
    AuthModule,
  ],
  controllers: [],
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
export class AppModule {}
