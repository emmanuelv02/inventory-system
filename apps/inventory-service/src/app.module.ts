import { Module } from '@nestjs/common';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), InventoryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
