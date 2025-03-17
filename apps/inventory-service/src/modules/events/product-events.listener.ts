/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ProductEvent, ProductEventType } from './models/product.events';
import { InventoryService } from '../inventory/inventory.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ProcessedEvent } from './entities/processed-event.entity';
import { Repository } from 'typeorm';
import { Product } from './models/product.interface';

@Controller()
export class ProductEventsListener {
  private readonly logger = new Logger(ProductEventsListener.name);

  constructor(
    @InjectRepository(ProcessedEvent)
    private readonly processedEventRepository: Repository<ProcessedEvent>,
    private readonly inventoryService: InventoryService,
  ) {}

  @EventPattern(ProductEventType.CREATED)
  async handleProductCreated(
    @Payload() event: ProductEvent,
    @Ctx() context: RmqContext,
  ) {
    const action = async (product: Product) => {
      await this.inventoryService.initializeInventoryForProduct(product);
    };

    await this.productEventHandlerWrapper(event, context, action);
  }

  @EventPattern(ProductEventType.UPDATED)
  async handleProductUpdated(
    @Payload() event: ProductEvent,
    @Ctx() context: RmqContext,
  ) {
    const action = async (product: Product) => {
      await this.inventoryService.updateProductName(product);
    };

    await this.productEventHandlerWrapper(event, context, action);
  }

  @EventPattern(ProductEventType.DELETED)
  async handleProductDeleted(
    @Payload() event: ProductEvent,
    @Ctx() context: RmqContext,
  ) {
    const action = async (product: Product) => {
      await this.inventoryService.deleteProductInvetory(product);
    };

    await this.productEventHandlerWrapper(event, context, action);
  }

  private async productEventHandlerWrapper(
    @Payload() event: ProductEvent,
    @Ctx() context: RmqContext,
    coreFunction: (product: Product) => Promise<void>,
  ) {
    try {
      this.logger.log(`Received ${event.type} event for: ${event.id}`);
      const isProcessed = await this.hasBeenProcessed(event);
      if (isProcessed) {
        this.logger.log(
          `Skipping processed event with correlationId: ${event.metadata.correlationId}`,
        );
        return;
      }

      await coreFunction(event.product);

      await this.markAsProcessed(event);
      this.acknolegeMessage(context);
    } catch (error) {
      this.logger.error(
        `Error processing ${event.type} event: ${error.message}`,
        error.stack,
      );
    }
  }

  private async hasBeenProcessed(event: ProductEvent): Promise<boolean> {
    return await this.processedEventRepository.existsBy({
      correlationId: event.metadata.correlationId,
    });
  }

  private async markAsProcessed(event: ProductEvent): Promise<void> {
    const processedEvent = this.processedEventRepository.create({
      correlationId: event.metadata.correlationId,
      eventType: event.type,
      entityId: event.id,
    });

    await this.processedEventRepository.save(processedEvent);
  }

  private acknolegeMessage(context: RmqContext) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const channel = context.getChannelRef();
    const message = context.getMessage();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    channel.ack(message);
  }
}
