import {
  BadRequestException,
  Inject,
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
import { ClientProxy } from '@nestjs/microservices';
import { ProductEvent, ProductEventType } from './events/product.events';
import { CacheService } from '@repo/shared';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
    private readonly exchangeService: ExchangeService,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    @Inject('PRODUCTS_SERVICE') private readonly rabbitClient: ClientProxy,
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

    const result = await this.productRepository.save(product);
    delete result.priceHistory;

    await this.clearProductsCache();

    this.sendProductEvent(result, ProductEventType.CREATED);

    return result;
  }

  async findAll(
    filters: FindAllFiltersDto,
    currency?: string,
  ): Promise<Product[]> {
    const products = await this.productRepository.find({
      where: { ...filters },
      order: { createdAt: 'DESC' },
    });

    const cacheKeyPrefix = 'products:all';
    let cacheKey = currency ? `${cacheKeyPrefix}:${currency}` : cacheKeyPrefix;
    if (filters?.category) cacheKey += `:category:${filters.category}`;

    const cachedResult = await this.cacheService.get<Product[]>(cacheKey);
    if (cachedResult) return cachedResult;

    const result = currency
      ? await this.convertCurrency(products, currency)
      : products;

    await this.cacheService.set(cacheKey, result);
    return result;
  }

  async findOneWithCurrency(id: string, currency?: string): Promise<Product> {
    const cacheKeyPrefix = `products:${id}`;
    const cacheKey = currency
      ? cacheKeyPrefix + `:${currency}`
      : cacheKeyPrefix;

    const cachedResult = await this.cacheService.get<Product>(cacheKey);
    if (cachedResult) return cachedResult;

    const product = await this.findOne(id);

    const result = currency
      ? (await this.convertCurrency([product], currency))[0]
      : product;

    await this.cacheService.set(cacheKey, result);

    return result;
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

        await this.clearProductCache(id);
        await this.clearProductsCache();
        this.sendProductEvent(product, ProductEventType.UPDATED);
      },
    );

    return product;
  }

  async remove(id: string): Promise<Product> {
    const product = await this.findOne(id);
    const result = this.productRepository.remove(product);

    await this.clearProductCache(id);
    await this.clearProductsCache();

    this.sendProductEvent(product, ProductEventType.DELETED);

    return result;
  }

  async getPriceHistory(
    id: string,
    currency?: string,
  ): Promise<PriceHistory[]> {
    const result = await this.priceHistoryRepository.find({
      where: { productId: id },
      order: { createdAt: 'DESC' },
    });

    const cacheKeyPrefix = `products:${id}:price-history`;
    const cacheKey = currency
      ? cacheKeyPrefix + `:${currency}`
      : cacheKeyPrefix;

    const cachedResult = await this.cacheService.get<PriceHistory[]>(cacheKey);
    if (cachedResult) return cachedResult;

    if (result?.length > 0) {
      const finalResult = currency
        ? this.convertCurrency(result, currency)
        : result;

      await this.cacheService.set<PriceHistory[]>(cacheKey, result);

      return finalResult;
    }

    throw new NotFoundException();
  }

  private async findOne(id: string): Promise<Product> {
    const result = await this.productRepository.findOne({
      where: { id },
    });

    if (!result) throw new NotFoundException();

    return result;
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

  private clearProductCache(id: string): Promise<number> {
    return this.cacheService.deleteKeysByPattern(`products:${id}*`);
  }

  private clearProductsCache(): Promise<number> {
    return this.cacheService.deleteKeysByPattern(`products:all*`);
  }

  private sendProductEvent(product: Product, eventType: ProductEventType) {
    this.rabbitClient.emit(eventType, new ProductEvent(product, eventType));
  }
}
