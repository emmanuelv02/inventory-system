/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ProductEvent, ProductEventType } from './models/product.events';
import { InventoryService } from '../inventory/inventory.service';

@Controller()
export class ProductEventsListener {
  private readonly logger = new Logger(ProductEventsListener.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @EventPattern(ProductEventType.CREATED)
  async handleProductCreated(@Payload() event: ProductEvent) {
    try {
      this.logger.log(`Received product created event for: ${event.id}`);
      await this.inventoryService.initializeInventoryForProduct(event.product);
    } catch (error) {
      this.logger.error(
        `Error processing product created event: ${error.message}`,
        error.stack,
      );
    }
  }

  @EventPattern(ProductEventType.UPDATED)
  async handleProductUpdated(@Payload() event: ProductEvent) {
    try {
      this.logger.log(`Received product updated event for: ${event.id}`);
      await this.inventoryService.updateProductName(event.product);
    } catch (error) {
      this.logger.error(
        `Error processing product updated event: ${error.message}`,
        error.stack,
      );
    }
  }

  @EventPattern(ProductEventType.DELETED)
  async handleProductDeleted(@Payload() event: ProductEvent) {
    try {
      this.logger.log(`Received product deleted event for: ${event.id}`);
      await this.inventoryService.deleteProductInvetory(event.product);
    } catch (error) {
      this.logger.error(
        `Error processing product deleted event: ${error.message}`,
        error.stack,
      );
    }
  }
}
