import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductInventory } from './entities/productInventory.entity';
import { ProductMovement } from './entities/productMovement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductInventory, ProductMovement])],
  providers: [InventoryService],
  exports: [InventoryService],
  controllers: [InventoryController],
})
export class InventoryModule {}
