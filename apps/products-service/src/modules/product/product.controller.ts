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
import { Roles } from '../auth/models/roles.decorator';
import { UserRole } from '../auth/models/user-role.enum';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get(':id')
  @Roles(UserRole.USER)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('currency') currency?: string,
  ) {
    return this.productService.findOneWithCurrency(id, currency);
  }

  @Get()
  @Roles(UserRole.USER)
  findAll(
    @Query() query: FindAllFiltersDto,
    @Query('currency') currency?: string,
  ) {
    return this.productService.findAll(query, currency);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.remove(id);
  }

  @Get(':id/price-history')
  @Roles(UserRole.USER)
  getPriceHistory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('currency') currency?: string,
  ) {
    return this.productService.getPriceHistory(id, currency);
  }
}
