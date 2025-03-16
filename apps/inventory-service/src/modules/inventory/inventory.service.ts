import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductInventory } from './entities/productInventory.entity';
import { ProductStockDto } from './dtos/productStock.dto';
import { ProductMovement } from './entities/productMovement.entity';
import { RegisterInventoryDto } from './dtos/registerInventory.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(ProductInventory)
    private readonly productInventoryRepository: Repository<ProductInventory>,

    @InjectRepository(ProductMovement)
    private readonly productMovementRepository: Repository<ProductMovement>,

    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  async getProductStock(productId: string): Promise<ProductStockDto> {
    const cacheKey = `stock:${productId}`;
    const cachedStock = await this.cacheService.get<ProductStockDto>(cacheKey);
    if (cachedStock) return cachedStock;

    const productInventory = await this.productInventoryRepository.findOne({
      where: { productId },
    });

    const result = {
      productId: productId,
      quantity: productInventory?.quantity || 0,
    };

    await this.cacheService.set(cacheKey, result);

    return result;
  }

  async registerInventory(
    registerInventoryDto: RegisterInventoryDto,
  ): Promise<void> {
    const productInventory = await this.productInventoryRepository.findOne({
      where: { productId: registerInventoryDto.productId },
    });

    if (!productInventory) throw new NotFoundException();

    let newQuantity = registerInventoryDto.quantity;

    await this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        if (productInventory) {
          if (registerInventoryDto.quantity + productInventory.quantity < 0) {
            throw new BadRequestException('Insufficient stock');
          }
          productInventory.quantity += registerInventoryDto.quantity;
          newQuantity = productInventory.quantity;
          await transactionalEntityManager.save(productInventory);
        } else {
          if (registerInventoryDto.quantity < 0) {
            throw new BadRequestException('Insufficient stock');
          }

          const productInventory = new ProductInventory();
          productInventory.productId = registerInventoryDto.productId;
          productInventory.quantity = registerInventoryDto.quantity;

          await transactionalEntityManager.save(productInventory);
        }

        const productMovement = new ProductMovement();
        productMovement.productId = registerInventoryDto.productId;
        productMovement.quantity = registerInventoryDto.quantity;
        productMovement.newQuantity = newQuantity;
        productMovement.description = registerInventoryDto.description;

        await transactionalEntityManager.save(productMovement);
      },
    );

    await this.cacheService.deleteKeys([
      `stock:${registerInventoryDto.productId}`,
      `movements:${registerInventoryDto.productId}`,
    ]);
  }

  async getProductMovements(productId: string): Promise<ProductMovement[]> {
    const cacheKey = `movements:${productId}`;
    const cachedMovements =
      await this.cacheService.get<ProductMovement[]>(cacheKey);
    if (cachedMovements) return cachedMovements;

    const result = await this.productMovementRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });

    await this.cacheService.set(cacheKey, result);

    return result;
  }
}
