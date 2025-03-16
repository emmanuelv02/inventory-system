import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dtos/createProduct.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { UpdateProductDto } from './dtos/updateProduct.dto';
import { FindAllFiltersDto } from './dtos/findAllFilters.dto';
import { ExchangeService } from '../exchange/exchange.service';
import { PriceHistory } from './entities/priceHistory.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
    private readonly exchangeService: ExchangeService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existingSku = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new BadRequestException('SKU already exists');
    }

    const product = {
      ...new Product(),
      ...createProductDto,
    };

    product.priceHistory = [];
    product.priceHistory.push({
      ...new PriceHistory(),
      price: product.price,
    });

    await this.productRepository.save(product);
    delete product.priceHistory;
    return product;
  }

  async findAll(
    filters: FindAllFiltersDto,
    currency?: string,
  ): Promise<Product[]> {
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    const oldPrice = product.price;

    const updatedProduct = {
      ...product,
      ...updateProductDto,
    };

    await this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        if (oldPrice != updatedProduct.price) {
          const priceHistory = new PriceHistory();
          Object.assign(priceHistory, {
            productId: product.id,
            price: updatedProduct.price,
          });

          await transactionalEntityManager.save(priceHistory);
        }

        Object.assign(product, updatedProduct);
        await transactionalEntityManager.save(product);
      },
    );

    return product;
  }

  async remove(id: string): Promise<Product> {
    const product = await this.findOne(id);
    return this.productRepository.remove(product);
  }

  async getPriceHistory(id: string, currency?: string) {
    const result = await this.priceHistoryRepository.find({
      where: { productId: id },
      order: { createdAt: 'DESC' },
    });

    if (result?.length > 0)
      return currency ? this.convertCurrency(result, currency) : result;

    throw new NotFoundException();
  }

  private async convertCurrency<T extends { price: number }>(
    items: T[],
    currency: string,
  ): Promise<T[]> {
    const rate = await this.exchangeService.getExchangeRate(currency);

    return items.map((item) => ({
      ...item,
      price: Number.parseFloat((item.price * rate).toFixed(2)),
    }));
  }
}
