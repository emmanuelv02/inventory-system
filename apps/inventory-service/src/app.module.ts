import { Module } from '@nestjs/common';
import { InventoryModule } from './modules/inventory/inventory.module';
import { EventsModule } from './modules/events/events.module';
import { MigrationService, SharedModule } from '@repo/shared/';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    SharedModule,
    InventoryModule,
    EventsModule,
  ],
  controllers: [],
  providers: [MigrationService],
  exports: [],
})
export class AppModule {}
