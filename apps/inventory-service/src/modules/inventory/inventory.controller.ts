import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RegisterInventoryDto } from './dtos/registerInventory.dto';
import { Roles, UserRole } from '@repo/shared';
import { ProductMovement } from './entities/productMovement.entity';
import { ProductStockDto } from './dtos/productStock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':productId')
  @Roles(UserRole.USER)
  getStock(
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ): Promise<ProductStockDto> {
    return this.inventoryService.getProductStock(productId);
  }

  @Post('register')
  @Roles(UserRole.ADMIN)
  registerInventory(
    @Body() registerInventoryDto: RegisterInventoryDto,
  ): Promise<void> {
    return this.inventoryService.registerInventory(registerInventoryDto);
  }

  @Get(':productId/movements')
  @Roles(UserRole.USER)
  getProductMovements(
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ): Promise<ProductMovement[]> {
    return this.inventoryService.getProductMovements(productId);
  }
}
