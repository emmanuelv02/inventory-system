import { Module } from '@nestjs/common';
import { ProductEventsListener } from './product-events.listener';
import { InventoryModule } from '../inventory/inventory.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessedEvent } from './entities/processed-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessedEvent]), InventoryModule],
  controllers: [ProductEventsListener],
})
export class EventsModule {}
