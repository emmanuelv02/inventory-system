import { Module } from '@nestjs/common';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';
import { EventsModule } from './modules/events/events.module';
import { MigrationService, SharedModule } from '@repo/shared/';
@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forRoot(dataSourceOptions),
    InventoryModule,
    EventsModule,
  ],
  controllers: [],
  providers: [MigrationService],
  exports: [],
})
export class AppModule {}
