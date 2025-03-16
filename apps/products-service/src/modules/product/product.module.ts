import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ExchangeModule } from '../exchange/exchange.module';
import { PriceHistory } from './entities/priceHistory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, PriceHistory]), ExchangeModule],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}
