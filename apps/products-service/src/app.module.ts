import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), ProductModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
