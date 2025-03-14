import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dtos/createProduct.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { UpdateProductDto } from './dtos/updateProduct.dto';
import { FindAllFiltersDto } from './dtos/findAllFilters.dto';
import { ExchangeService } from '../exchange/exchange.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    private readonly exchangeService: ExchangeService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const existingSku = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new BadRequestException('SKU already exists');
    }

    return this.productRepository.save(createProductDto);
  }

  async findAll(filters: FindAllFiltersDto, currency?: string) {
    const products = await this.productRepository.find({
      where: { ...filters },
      order: { createdAt: 'DESC' },
    });

    return currency ? this.convertCurrency(products, currency) : products;
  }

  async findOne(id: string) {
    const result = await this.productRepository.findOne({
      where: { id },
    });

    if (!result) throw new NotFoundException();
    return result;
  }

  async findOneWithCurrency(id: string, currency?: string) {
    const result = await this.findOne(id);

    return currency
      ? (await this.convertCurrency([result], currency))[0]
      : result;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    const updatedProduct = {
      ...product,
      ...updateProductDto,
    };

    return this.productRepository.save(updatedProduct);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    return this.productRepository.remove(product);
  }

  private async convertCurrency(products: Product[], currency: string) {
    const rate = await this.exchangeService.getExchangeRate(currency);

    return products.map((product) => ({
      ...product,
      price: (product.price * rate).toFixed(2),
    }));
  }
}
