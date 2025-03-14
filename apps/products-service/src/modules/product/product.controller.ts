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

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.findOne(id);
  }

  @Get()
  findAll(@Query() query: FindAllFiltersDto) {
    return this.productService.findAll(query);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.remove(id);
  }
}
