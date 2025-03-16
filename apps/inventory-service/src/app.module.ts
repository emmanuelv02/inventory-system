import { Module } from '@nestjs/common';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';
import { CacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    InventoryModule,
    CacheModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
