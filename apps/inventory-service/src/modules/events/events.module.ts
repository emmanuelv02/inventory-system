import { Module } from '@nestjs/common';
import { ProductEventsListener } from './product-events.listener';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [ProductEventsListener],
})
export class EventsModule {}
