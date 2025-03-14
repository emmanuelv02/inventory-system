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

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':productId')
  getStock(@Param('productId', new ParseUUIDPipe()) productId: string) {
    return this.inventoryService.getProductStock(productId);
  }

  @Post('register')
  registerInventory(@Body() registerInventoryDto: RegisterInventoryDto) {
    return this.inventoryService.registerInventory(registerInventoryDto);
  }
}
