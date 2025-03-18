/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductService } from '../product.service';
import { Product } from '../entities/product.entity';
import { PriceHistory } from '../entities/priceHistory.entity';
import { ExchangeService } from '../../exchange/exchange.service';
import { CacheService, ProductEventType } from '@repo/shared';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: Repository<Product>;
  let priceHistoryRepository: Repository<PriceHistory>;
  let exchangeService: ExchangeService;
  let cacheService: CacheService;
  let dataSource: DataSource;

  const mockProductRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockPriceHistoryRepository = {
    find: jest.fn(),
  };

  const mockExchangeService = {
    getExchangeRate: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    deleteKeysByPattern: jest.fn(),
  };

  const mockDataSource = {
    manager: {
      transaction: jest.fn(),
    },
  };

  const mockRabbitClient = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(PriceHistory),
          useValue: mockPriceHistoryRepository,
        },
        {
          provide: ExchangeService,
          useValue: mockExchangeService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: 'PRODUCTS_SERVICE',
          useValue: mockRabbitClient,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    priceHistoryRepository = module.get<Repository<PriceHistory>>(
      getRepositoryToken(PriceHistory),
    );
    exchangeService = module.get<ExchangeService>(ExchangeService);
    cacheService = module.get<CacheService>(CacheService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProductDto = {
      sku: 'TEST-SKU',
      name: 'Test Product',
      price: 100,
      category: 'test',
      description: 'test desc',
    };

    it('should create a product and send event', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);
      mockProductRepository.save.mockResolvedValue({
        id: 'test-id',
        ...createProductDto,
      });
      mockCacheService.deleteKeysByPattern.mockResolvedValue(1);

      const result = await service.create(createProductDto);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { sku: 'TEST-SKU' },
      });

      expect(mockCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'products:all*',
      );
      expect(mockRabbitClient.emit).toHaveBeenCalledWith(
        ProductEventType.CREATED,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ product: expect.anything() }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'test-id',
          ...createProductDto,
        }),
      );
    });

    it('should throw BadRequestException if SKU exists', async () => {
      mockProductRepository.findOne.mockResolvedValue({
        id: 'existing-id',
        sku: 'TEST-SKU',
      });

      await expect(service.create(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const products = [
      { id: '1', name: 'Product 1', price: 100 },
      { id: '2', name: 'Product 2', price: 200 },
    ];

    const filters = { category: 'test' };

    it('should return cached products if available', async () => {
      mockCacheService.get.mockResolvedValue(products);

      const result = await service.findAll(filters);

      expect(cacheService.get).toHaveBeenCalledWith(
        'products:all:category:test',
      );
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(result).toEqual(products);
    });

    it('should find and cache products if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockProductRepository.find.mockResolvedValue(products);

      const result = await service.findAll(filters);

      expect(cacheService.get).toHaveBeenCalledWith(
        'products:all:category:test',
      );
      expect(productRepository.find).toHaveBeenCalledWith({
        where: filters,
        order: { createdAt: 'DESC' },
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        'products:all:category:test',
        products,
      );
      expect(result).toEqual(products);
    });

    it('should convert prices to requested currency', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockProductRepository.find.mockResolvedValue(products);
      mockExchangeService.getExchangeRate.mockResolvedValue(1.2);

      const result = await service.findAll(filters, 'EUR');

      expect(exchangeService.getExchangeRate).toHaveBeenCalledWith('EUR');
      expect(result).toEqual([
        { id: '1', name: 'Product 1', price: 120 },
        { id: '2', name: 'Product 2', price: 240 },
      ]);
    });
  });

  describe('findOneWithCurrency', () => {
    const product = { id: 'test-id', name: 'Test Product', price: 100 };

    it('should return cached product if available', async () => {
      mockCacheService.get.mockResolvedValue(product);

      const result = await service.findOneWithCurrency('test-id');

      expect(cacheService.get).toHaveBeenCalledWith('products:test-id');
      expect(result).toEqual(product);
    });

    it('should find and cache product if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(product);

      const result = await service.findOneWithCurrency('test-id');

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        'products:test-id',
        product,
      );
      expect(result).toEqual(product);
    });

    it('should convert price to requested currency', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(product);
      mockExchangeService.getExchangeRate.mockResolvedValue(1.5);

      const result = await service.findOneWithCurrency('test-id', 'EUR');

      expect(exchangeService.getExchangeRate).toHaveBeenCalledWith('EUR');
      expect(result).toEqual({ ...product, price: 150 });
    });
  });

  describe('update', () => {
    const product = {
      id: 'test-id',
      name: 'Test Product',
      price: 100,
    };

    const updateDto = {
      name: 'Updated Product',
      price: 150,
    };

    it('should update product and add price history if price changed', async () => {
      mockProductRepository.findOne.mockResolvedValue(product);
      mockDataSource.manager.transaction.mockImplementation(
        async (callback) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          await callback({
            save: jest.fn().mockResolvedValue({}),
          });
        },
      );

      await service.update('test-id', updateDto);

      expect(dataSource.manager.transaction).toHaveBeenCalled();
      expect(mockCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'products:test-id*',
      );
      expect(mockCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'products:all*',
      );
      expect(mockRabbitClient.emit).toHaveBeenCalledWith(
        ProductEventType.UPDATED,
        expect.anything(),
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.update('test-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const product = { id: 'test-id', name: 'Test Product', price: 100 };

    it('should remove product and clear cache', async () => {
      mockProductRepository.findOne.mockResolvedValue(product);
      mockProductRepository.remove.mockResolvedValue(product);

      const result = await service.remove('test-id');

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(productRepository.remove).toHaveBeenCalledWith(product);
      expect(mockCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'products:test-id*',
      );
      expect(mockCacheService.deleteKeysByPattern).toHaveBeenCalledWith(
        'products:all*',
      );
      expect(mockRabbitClient.emit).toHaveBeenCalledWith(
        ProductEventType.DELETED,
        expect.anything(),
      );
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('test-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPriceHistory', () => {
    const priceHistory = [
      { id: '1', productId: 'test-id', price: 80, createdAt: new Date() },
      { id: '2', productId: 'test-id', price: 100, createdAt: new Date() },
    ];

    it('should return cached price history if available', async () => {
      mockCacheService.get.mockResolvedValue(priceHistory);

      const result = await service.getPriceHistory('test-id');

      expect(cacheService.get).toHaveBeenCalledWith(
        'products:test-id:price-history',
      );
      expect(cacheService.set).not.toHaveBeenCalled();
      expect(result).toEqual(priceHistory);
    });

    it('should find and cache price history if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPriceHistoryRepository.find.mockResolvedValue(priceHistory);

      const result = await service.getPriceHistory('test-id');

      expect(priceHistoryRepository.find).toHaveBeenCalledWith({
        where: { productId: 'test-id' },
        order: { createdAt: 'DESC' },
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        'products:test-id:price-history',
        priceHistory,
      );
      expect(result).toEqual(priceHistory);
    });

    it('should convert prices to requested currency', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPriceHistoryRepository.find.mockResolvedValue(priceHistory);
      mockExchangeService.getExchangeRate.mockResolvedValue(2);

      const result = await service.getPriceHistory('test-id', 'EUR');

      expect(exchangeService.getExchangeRate).toHaveBeenCalledWith('EUR');
      expect(result).toEqual([
        { ...priceHistory[0], price: 160 },
        { ...priceHistory[1], price: 200 },
      ]);
    });

    it('should throw NotFoundException if no price history found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPriceHistoryRepository.find.mockResolvedValue([]);

      await expect(service.getPriceHistory('test-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
