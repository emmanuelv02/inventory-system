/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory/inventory.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProcessedEvent } from './entities/processed-event.entity';
import { Repository } from 'typeorm';
import { ProductEvent, ProductEventType } from './models/product.events';
import { Product } from './models/product.interface';
import { RmqContext } from '@nestjs/microservices';
import { ProductEventsListener } from './product-events.listener';

describe('ProductEventsListener', () => {
  let listener: ProductEventsListener;
  let inventoryService: InventoryService;
  let processedEventRepository: Repository<ProcessedEvent>;

  // Mock product event
  const mockProduct: Product = {
    id: '123',
    name: 'Test Product',
    price: 99.99,
    category: 'Test Category',
    sku: 'Test-sku',
    description: 'Test description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEvent: ProductEvent = {
    id: '123',
    type: ProductEventType.CREATED,
    product: mockProduct,
    metadata: {
      correlationId: 'test-correlation-id',
    },
  };

  // Mock RMQ context
  const mockContext = {
    getChannelRef: jest.fn().mockReturnValue({
      ack: jest.fn(),
    }),
    getMessage: jest.fn(),
  } as unknown as RmqContext;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductEventsListener],
      providers: [
        {
          provide: InventoryService,
          useValue: {
            initializeInventoryForProduct: jest
              .fn()
              .mockResolvedValue(undefined),
            updateProductName: jest.fn().mockResolvedValue(undefined),
            deleteProductInvetory: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(ProcessedEvent),
          useValue: {
            existsBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<ProductEventsListener>(ProductEventsListener);
    inventoryService = module.get<InventoryService>(InventoryService);
    processedEventRepository = module.get<Repository<ProcessedEvent>>(
      getRepositoryToken(ProcessedEvent),
    );
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleProductCreated', () => {
    it('should initialize inventory for a new product', async () => {
      jest.spyOn(processedEventRepository, 'existsBy').mockResolvedValue(false);
      jest.spyOn(processedEventRepository, 'create').mockReturnValue({
        correlationId: mockEvent.metadata.correlationId,
        eventType: mockEvent.type,
        entityId: mockEvent.id,
      } as ProcessedEvent);

      await listener.handleProductCreated(mockEvent, mockContext);

      expect(processedEventRepository.existsBy).toHaveBeenCalledWith({
        correlationId: mockEvent.metadata.correlationId,
      });
      expect(
        inventoryService.initializeInventoryForProduct,
      ).toHaveBeenCalledWith(mockProduct);
      expect(processedEventRepository.save).toHaveBeenCalled();
      expect(mockContext.getChannelRef().ack).toHaveBeenCalled();
    });

    it('should skip already processed events', async () => {
      jest.spyOn(processedEventRepository, 'existsBy').mockResolvedValue(true);

      await listener.handleProductCreated(mockEvent, mockContext);

      expect(processedEventRepository.existsBy).toHaveBeenCalledWith({
        correlationId: mockEvent.metadata.correlationId,
      });
      expect(
        inventoryService.initializeInventoryForProduct,
      ).not.toHaveBeenCalled();
      expect(processedEventRepository.save).not.toHaveBeenCalled();
      expect(mockContext.getChannelRef().ack).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      jest
        .spyOn(processedEventRepository, 'existsBy')
        .mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await listener.handleProductCreated(mockEvent, mockContext);

      expect(processedEventRepository.existsBy).toHaveBeenCalledWith({
        correlationId: mockEvent.metadata.correlationId,
      });
      expect(
        inventoryService.initializeInventoryForProduct,
      ).not.toHaveBeenCalled();
      expect(processedEventRepository.save).not.toHaveBeenCalled();
      expect(mockContext.getChannelRef().ack).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('handleProductUpdated', () => {
    it('should update product name in inventory', async () => {
      const updatedEvent = {
        ...mockEvent,
        type: ProductEventType.UPDATED,
      };

      // Mock repository to say event hasn't been processed
      jest.spyOn(processedEventRepository, 'existsBy').mockResolvedValue(false);
      jest.spyOn(processedEventRepository, 'create').mockReturnValue({
        correlationId: updatedEvent.metadata.correlationId,
        eventType: updatedEvent.type,
        entityId: updatedEvent.id,
      } as ProcessedEvent);

      await listener.handleProductUpdated(updatedEvent, mockContext);

      expect(processedEventRepository.existsBy).toHaveBeenCalledWith({
        correlationId: updatedEvent.metadata.correlationId,
      });
      expect(inventoryService.updateProductName).toHaveBeenCalledWith(
        mockProduct,
      );
      expect(processedEventRepository.save).toHaveBeenCalled();
      expect(mockContext.getChannelRef().ack).toHaveBeenCalled();
    });
  });

  describe('handleProductDeleted', () => {
    it('should delete product inventory', async () => {
      const deletedEvent = {
        ...mockEvent,
        type: ProductEventType.DELETED,
      };

      jest.spyOn(processedEventRepository, 'existsBy').mockResolvedValue(false);
      jest.spyOn(processedEventRepository, 'create').mockReturnValue({
        correlationId: deletedEvent.metadata.correlationId,
        eventType: deletedEvent.type,
        entityId: deletedEvent.id,
      } as ProcessedEvent);

      await listener.handleProductDeleted(deletedEvent, mockContext);

      expect(processedEventRepository.existsBy).toHaveBeenCalledWith({
        correlationId: deletedEvent.metadata.correlationId,
      });
      expect(inventoryService.deleteProductInvetory).toHaveBeenCalledWith(
        mockProduct,
      );
      expect(processedEventRepository.save).toHaveBeenCalled();
      expect(mockContext.getChannelRef().ack).toHaveBeenCalled();
    });
  });

  describe('productEventHandlerWrapper', () => {
    it('should mark event as processed after successful execution', async () => {
      // Mock repository to say event hasn't been processed
      jest.spyOn(processedEventRepository, 'existsBy').mockResolvedValue(false);
      jest.spyOn(processedEventRepository, 'create').mockReturnValue({
        correlationId: mockEvent.metadata.correlationId,
        eventType: mockEvent.type,
        entityId: mockEvent.id,
      } as ProcessedEvent);

      const coreFunction = jest.fn().mockResolvedValue(undefined);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await (listener as any).productEventHandlerWrapper(
        mockEvent,
        mockContext,
        coreFunction,
      );

      expect(coreFunction).toHaveBeenCalledWith(mockProduct);
      expect(processedEventRepository.save).toHaveBeenCalled();
      expect(mockContext.getChannelRef().ack).toHaveBeenCalled();
    });
  });
});
