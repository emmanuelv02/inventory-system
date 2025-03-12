import { Module } from '@nestjs/common';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
