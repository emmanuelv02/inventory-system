import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';
import { ProductModule } from './modules/product/product.module';
import { SharedModule } from '@repo/shared';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forRoot(dataSourceOptions),
    ProductModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
