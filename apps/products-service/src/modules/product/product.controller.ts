import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateProductDto } from './dtos/createProduct.dto';
import { ProductService } from './product.service';
import { UpdateProductDto } from './dtos/updateProduct.dto';
import { FindAllFiltersDto } from './dtos/findAllFilters.dto';
import { Roles, UserRole } from '@repo/shared';
import { Product } from './entities/product.entity';
import { PriceHistory } from './entities/priceHistory.entity';

@Controller('api/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Get(':id')
  @Roles(UserRole.USER)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('currency') currency?: string,
  ): Promise<Product> {
    return this.productService.findOneWithCurrency(id, currency);
  }

  @Get()
  @Roles(UserRole.USER)
  findAll(
    @Query() query: FindAllFiltersDto,
    @Query('currency') currency?: string,
  ): Promise<Product[]> {
    return this.productService.findAll(query, currency);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<Product> {
    return this.productService.remove(id);
  }

  @Get(':id/price-history')
  @Roles(UserRole.USER)
  getPriceHistory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('currency') currency?: string,
  ): Promise<PriceHistory[]> {
    return this.productService.getPriceHistory(id, currency);
  }
}
