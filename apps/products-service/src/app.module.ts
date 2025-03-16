import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';
import { ProductModule } from './modules/product/product.module';
import { CacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    CacheModule,
    ProductModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
