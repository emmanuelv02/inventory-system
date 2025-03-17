import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductInventory } from './entities/productInventory.entity';
import { ProductMovement } from './entities/productMovement.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductInventory, ProductMovement]),
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || ''],
          queue: 'inventory-queue',
        },
      },
    ]),
  ],
  providers: [InventoryService],
  exports: [InventoryService],
  controllers: [InventoryController],
})
export class InventoryModule {}
