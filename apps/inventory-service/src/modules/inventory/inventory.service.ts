import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductInventory } from './entities/productInventory.entity';
import { ProductStockDto } from './dtos/productStock.dto';
import { ProductMovement } from './entities/productMovement.entity';
import { RegisterInventoryDto } from './dtos/registerInventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(ProductInventory)
    private readonly productInventoryRepository: Repository<ProductInventory>,

    @InjectRepository(ProductMovement)
    private readonly productMovementRepository: Repository<ProductMovement>,

    private readonly dataSource: DataSource,
  ) {}

  async getProductStock(productId: string): Promise<ProductStockDto> {
    const productInventory = await this.productInventoryRepository.findOne({
      where: { productId },
    });

    return {
      productId: productId,
      quantity: productInventory?.quantity || 0,
    };
  }

  async registerInventory(
    registerInventoryDto: RegisterInventoryDto,
  ): Promise<void> {
    const productInventory = await this.productInventoryRepository.findOne({
      where: { productId: registerInventoryDto.productId },
    });

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
  }

  async getProductMovements(productId: string): Promise<ProductMovement[]> {
    return this.productMovementRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }
}
