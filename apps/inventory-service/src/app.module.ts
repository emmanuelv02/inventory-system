import { Module } from '@nestjs/common';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';
import { CacheModule } from './modules/cache/cache.module';
import { EventsModule } from './modules/events/events.module';
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    InventoryModule,
    CacheModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
