import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductInventory } from './entities/productInventory.entity';
import { ProductStockDto } from './dtos/productStock.dto';
import { ProductMovement } from './entities/productMovement.entity';
import { RegisterInventoryDto } from './dtos/registerInventory.dto';
import { Product } from '../events/models/product.interface';
import { ClientProxy } from '@nestjs/microservices';
import { InventoryEvent, InventoryEventType } from './events/inventory.events';
import { CacheService } from '@repo/shared';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(ProductInventory)
    private readonly productInventoryRepository: Repository<ProductInventory>,
    @InjectRepository(ProductMovement)
    private readonly productMovementRepository: Repository<ProductMovement>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    @Inject('INVENTORY_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  async findOne(productId: string) {
    const productInventory = await this.productInventoryRepository.findOne({
      where: { productId },
    });

    if (productInventory) return productInventory;
    throw new NotFoundException();
  }

  async getProductStock(productId: string): Promise<ProductStockDto> {
    const cacheKey = `stock:${productId}`;
    const cachedStock = await this.cacheService.get<ProductStockDto>(cacheKey);
    if (cachedStock) return cachedStock;

    const productInventory = await this.findOne(productId);
    const result = {
      productId: productId,
      productName: productInventory.productName,
      quantity: productInventory?.quantity || 0,
    };

    await this.cacheService.set(cacheKey, result);

    return result;
  }

  async initializeInventoryForProduct(product: Product) {
    await this.registerInventory(
      {
        productId: product.id,
        quantity: 0,
        description: 'Product initialization',
      },
      { productName: product.name },
    );
  }

  async updateProductName(product: Product): Promise<ProductInventory | null> {
    const inventory = await this.findOne(product.id);
    if (product.name == inventory.productName) return null;

    inventory.productName = product.name;
    return await this.productInventoryRepository.save(inventory);
  }

  async deleteProductInvetory(
    product: Product,
  ): Promise<ProductInventory | null> {
    const inventory = await this.findOne(product.id);
    return await this.productInventoryRepository.remove(inventory);
  }

  async registerInventory(
    registerInventoryDto: RegisterInventoryDto,
    initializationProperties?: { productName: string },
  ): Promise<void> {
    const productInventory = await this.productInventoryRepository.findOne({
      where: { productId: registerInventoryDto.productId },
    });

    if (!initializationProperties && !productInventory)
      throw new NotFoundException();

    let newQuantity = registerInventoryDto.quantity;

    await this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        if (productInventory) {
          if (registerInventoryDto.quantity + productInventory.quantity < 0) {
            throw new BadRequestException('Insufficient stock');
          }
          productInventory.quantity += registerInventoryDto.quantity;
          newQuantity = productInventory.quantity;
          const inventory =
            await transactionalEntityManager.save(productInventory);

          this.rabbitClient.emit(
            InventoryEventType.UPDATED,
            new InventoryEvent(inventory, InventoryEventType.UPDATED),
          );
        } else {
          if (registerInventoryDto.quantity < 0) {
            throw new BadRequestException('Insufficient stock');
          }

          const productInventory = new ProductInventory();
          productInventory.productId = registerInventoryDto.productId;
          productInventory.quantity = registerInventoryDto.quantity;
          productInventory.productName =
            initializationProperties?.productName ?? '';

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
