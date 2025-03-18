/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../inventory.service';
import { ProductInventory } from '../entities/productInventory.entity';
import { ProductMovement } from '../entities/productMovement.entity';
import { Product } from '../../events/models/product.interface';
import { InventoryEventType } from '../events/inventory.events';
import { CacheService } from '@repo/shared';

describe('InventoryService', () => {
  let service: InventoryService;
  let productInventoryRepository: Repository<ProductInventory>;
  let productMovementRepository: Repository<ProductMovement>;
  let dataSource: DataSource;
  let cacheService: CacheService;

  const mockProductInventoryRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockProductMovementRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    manager: {
      transaction: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    deleteKeys: jest.fn(),
  };

  const mockRabbitClient = {
    emit: jest.fn(),
  };

  const baseProduct = {
    id: '123',
    name: 'Test Product',
    price: 10,
    category: 'Test Category',
    sku: 'Test-sku',
    description: 'Test description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(ProductInventory),
          useValue: mockProductInventoryRepository,
        },
        {
          provide: getRepositoryToken(ProductMovement),
          useValue: mockProductMovementRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: 'INVENTORY_SERVICE',
          useValue: mockRabbitClient,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    productInventoryRepository = module.get<Repository<ProductInventory>>(
      getRepositoryToken(ProductInventory),
    );
    productMovementRepository = module.get<Repository<ProductMovement>>(
      getRepositoryToken(ProductMovement),
    );
    dataSource = module.get<DataSource>(DataSource);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a product inventory when found', async () => {
      const mockProductInventory = {
        productId: '123',
        quantity: 10,
        productName: 'Test Product',
      };
      mockProductInventoryRepository.findOne.mockResolvedValue(
        mockProductInventory,
      );

      const result = await service.findOne('123');

      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
      expect(result).toEqual(mockProductInventory);
    });

    it('should throw NotFoundException when product inventory not found', async () => {
      mockProductInventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('123')).rejects.toThrow(NotFoundException);

      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
    });
  });

  describe('getProductStock', () => {
    it('should return cached stock when available', async () => {
      const cachedStock = {
        productId: '123',
        productName: 'Test Product',
        quantity: 10,
      };
      mockCacheService.get.mockResolvedValue(cachedStock);

      const result = await service.getProductStock('123');

      expect(cacheService.get).toHaveBeenCalledWith('stock:123');
      expect(result).toEqual(cachedStock);
      expect(productInventoryRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch stock from database and cache it when not cached', async () => {
      const productInventory = {
        productId: '123',
        productName: 'Test Product',
        quantity: 10,
      };
      mockCacheService.get.mockResolvedValue(null);
      mockProductInventoryRepository.findOne.mockResolvedValue(
        productInventory,
      );

      const result = await service.getProductStock('123');

      expect(cacheService.get).toHaveBeenCalledWith('stock:123');
      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
      expect(cacheService.set).toHaveBeenCalledWith('stock:123', {
        productId: '123',
        productName: 'Test Product',
        quantity: 10,
      });
      expect(result).toEqual({
        productId: '123',
        productName: 'Test Product',
        quantity: 10,
      });
    });
  });

  describe('initializeInventoryForProduct', () => {
    it('should call registerInventory with correct parameters', async () => {
      const product: Product = baseProduct;

      jest.spyOn(service, 'registerInventory').mockResolvedValue();

      await service.initializeInventoryForProduct(product);

      expect(service.registerInventory).toHaveBeenCalledWith(
        {
          productId: '123',
          quantity: 0,
          description: 'Product initialization',
        },
        { productName: 'Test Product' },
      );
    });
  });

  describe('updateProductName', () => {
    it('should update product name when different', async () => {
      const product: Product = {
        ...baseProduct,
        name: 'Updated Product',
      };
      const inventory = {
        productId: '123',
        productName: 'Old Product Name',
        quantity: 10,
      };
      const updatedInventory = {
        productId: '123',
        productName: 'Updated Product',
        quantity: 10,
      };

      mockProductInventoryRepository.findOne.mockResolvedValue(inventory);
      mockProductInventoryRepository.save.mockResolvedValue(updatedInventory);

      const result = await service.updateProductName(product);

      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
      expect(productInventoryRepository.save).toHaveBeenCalledWith({
        ...inventory,
        productName: 'Updated Product',
      });
      expect(result).toEqual(updatedInventory);
    });

    it('should return null when product name is the same', async () => {
      const product: Product = { ...baseProduct, name: 'Same Product' };
      const inventory = {
        productId: '123',
        productName: 'Same Product',
        quantity: 10,
      };

      mockProductInventoryRepository.findOne.mockResolvedValue(inventory);

      const result = await service.updateProductName(product);

      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
      expect(productInventoryRepository.save).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('deleteProductInvetory', () => {
    it('should remove the product inventory', async () => {
      const product: Product = baseProduct;
      const inventory = {
        productId: '123',
        productName: 'Test Product',
        quantity: 10,
      };

      mockProductInventoryRepository.findOne.mockResolvedValue(inventory);
      mockProductInventoryRepository.remove.mockResolvedValue(inventory);

      const result = await service.deleteProductInvetory(product);

      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
      expect(productInventoryRepository.remove).toHaveBeenCalledWith(inventory);
      expect(result).toEqual(inventory);
    });
  });

  describe('registerInventory', () => {
    it('should create new inventory when product does not exist', async () => {
      const dto = {
        productId: '123',
        quantity: 10,
        description: 'Initial stock',
      };
      const initProps = { productName: 'New Product' };

      mockProductInventoryRepository.findOne.mockResolvedValue(null);

      // Mock transaction function
      mockDataSource.manager.transaction.mockImplementation(
        async (callback) => {
          await callback({
            save: jest.fn().mockImplementation((entity) => entity),
          });
        },
      );

      await service.registerInventory(dto, initProps);

      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
      expect(dataSource.manager.transaction).toHaveBeenCalled();
      expect(cacheService.deleteKeys).toHaveBeenCalledWith([
        'stock:123',
        'movements:123',
      ]);
    });

    it('should update existing inventory when product exists', async () => {
      const dto = {
        productId: '123',
        quantity: 5,
        description: 'Add stock',
      };
      const existingInventory = {
        productId: '123',
        productName: 'Test Product',
        quantity: 10,
      };

      mockProductInventoryRepository.findOne.mockResolvedValue(
        existingInventory,
      );

      // Mock transaction function
      mockDataSource.manager.transaction.mockImplementation(
        async (callback) => {
          await callback({
            save: jest.fn().mockImplementation((entity) => entity),
          });
        },
      );

      await service.registerInventory(dto);

      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
      expect(dataSource.manager.transaction).toHaveBeenCalled();
      expect(mockRabbitClient.emit).toHaveBeenCalledWith(
        InventoryEventType.UPDATED,
        expect.objectContaining({
          type: InventoryEventType.UPDATED,
        }),
      );
      expect(cacheService.deleteKeys).toHaveBeenCalledWith([
        'stock:123',
        'movements:123',
      ]);
    });

    it('should throw BadRequestException when trying to decrease below zero', async () => {
      const dto = {
        productId: '123',
        quantity: -15, // Trying to reduce more than available
        description: 'Remove stock',
      };
      const existingInventory = {
        productId: '123',
        productName: 'Test Product',
        quantity: 10, // Only 10 in stock
      };

      mockProductInventoryRepository.findOne.mockResolvedValue(
        existingInventory,
      );

      await expect(service.registerInventory(dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
    });

    it('should throw NotFoundException when product not found and not initializing', async () => {
      const dto = {
        productId: '123',
        quantity: 5,
        description: 'Add stock',
      };

      mockProductInventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.registerInventory(dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(productInventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: '123' },
      });
    });
  });

  describe('getProductMovements', () => {
    it('should return cached movements when available', async () => {
      const cachedMovements = [
        {
          productId: '123',
          quantity: 10,
          newQuantity: 10,
          description: 'Initial',
        },
        {
          productId: '123',
          quantity: 5,
          newQuantity: 15,
          description: 'Add more',
        },
      ];
      mockCacheService.get.mockResolvedValue(cachedMovements);

      const result = await service.getProductMovements('123');

      expect(cacheService.get).toHaveBeenCalledWith('movements:123');
      expect(result).toEqual(cachedMovements);
      expect(productMovementRepository.find).not.toHaveBeenCalled();
    });

    it('should fetch movements from database and cache them when not cached', async () => {
      const movements = [
        {
          productId: '123',
          quantity: 10,
          newQuantity: 10,
          description: 'Initial',
        },
        {
          productId: '123',
          quantity: 5,
          newQuantity: 15,
          description: 'Add more',
        },
      ];
      mockCacheService.get.mockResolvedValue(null);
      mockProductMovementRepository.find.mockResolvedValue(movements);

      const result = await service.getProductMovements('123');

      expect(cacheService.get).toHaveBeenCalledWith('movements:123');
      expect(productMovementRepository.find).toHaveBeenCalledWith({
        where: { productId: '123' },
        order: { createdAt: 'DESC' },
      });
      expect(cacheService.set).toHaveBeenCalledWith('movements:123', movements);
      expect(result).toEqual(movements);
    });
  });
});
