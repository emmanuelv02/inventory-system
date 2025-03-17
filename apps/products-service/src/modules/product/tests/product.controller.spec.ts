/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from '../product.controller';
import { ProductService } from '../product.service';
import { CreateProductDto } from '../dtos/createProduct.dto';
import { FindAllFiltersDto } from '../dtos/findAllFilters.dto';
import { UpdateProductDto } from '../dtos/updateProduct.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: ProductService;

  const mockProductService = {
    create: jest.fn(),
    findOneWithCurrency: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getPriceHistory: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        price: 99.99,
        sku: 'TEST-SKU-001',
        category: 'electronics',
        description: 'The description of the test product',
      };

      const expectedResult = {
        id: 'test-uuid',
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createProductDto);

      expect(productService.create).toHaveBeenCalledWith(createProductDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should find a product by id', async () => {
      const productId = '2f8d906c-0cd4-4a1b-bbee-d4a153e63347';
      const expectedResult = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
      };

      mockProductService.findOneWithCurrency.mockResolvedValue(expectedResult);

      const result = await controller.findOne(productId);

      expect(productService.findOneWithCurrency).toHaveBeenCalledWith(
        productId,
        undefined,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should find a product by id with currency conversion', async () => {
      const productId = '2f8d906c-0cd4-4a1b-bbee-d4a153e63347';
      const currency = 'EUR';
      const expectedResult = {
        id: productId,
        name: 'Test Product',
        price: 85.99, // Converted price
      };

      mockProductService.findOneWithCurrency.mockResolvedValue(expectedResult);

      const result = await controller.findOne(productId, currency);

      expect(productService.findOneWithCurrency).toHaveBeenCalledWith(
        productId,
        currency,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should find all products with no filters', async () => {
      const filters: FindAllFiltersDto = {};
      const expectedResults = [
        { id: '1', name: 'Product 1', price: 99.99 },
        { id: '2', name: 'Product 2', price: 149.99 },
      ];

      mockProductService.findAll.mockResolvedValue(expectedResults);

      const result = await controller.findAll(filters);

      expect(productService.findAll).toHaveBeenCalledWith(filters, undefined);
      expect(result).toEqual(expectedResults);
    });

    it('should find all products with category filter', async () => {
      const filters: FindAllFiltersDto = { category: 'electronics' };
      const expectedResults = [
        { id: '1', name: 'Product 1', price: 99.99, category: 'electronics' },
      ];

      mockProductService.findAll.mockResolvedValue(expectedResults);

      const result = await controller.findAll(filters);

      expect(productService.findAll).toHaveBeenCalledWith(filters, undefined);
      expect(result).toEqual(expectedResults);
    });

    it('should find all products with currency conversion', async () => {
      const filters: FindAllFiltersDto = {};
      const currency = 'EUR';
      const expectedResults = [
        { id: '1', name: 'Product 1', price: 85.99 },
        { id: '2', name: 'Product 2', price: 129.99 },
      ];

      mockProductService.findAll.mockResolvedValue(expectedResults);

      const result = await controller.findAll(filters, currency);

      expect(productService.findAll).toHaveBeenCalledWith(filters, currency);
      expect(result).toEqual(expectedResults);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const productId = '2f8d906c-0cd4-4a1b-bbee-d4a153e63347';
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 129.99,
      };

      const expectedResult = {
        id: productId,
        ...updateProductDto,
        sku: 'TEST-SKU-001',
        updatedAt: new Date(),
      };

      mockProductService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(productId, updateProductDto);

      expect(productService.update).toHaveBeenCalledWith(
        productId,
        updateProductDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const productId = '2f8d906c-0cd4-4a1b-bbee-d4a153e63347';
      const expectedResult = {
        id: productId,
        name: 'Test Product',
      };

      mockProductService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(productId);

      expect(productService.remove).toHaveBeenCalledWith(productId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getPriceHistory', () => {
    it('should get product price history', async () => {
      const productId = '2f8d906c-0cd4-4a1b-bbee-d4a153e63347';
      const expectedResult = [
        { id: '1', productId, price: 89.99, createdAt: new Date() },
        { id: '2', productId, price: 99.99, createdAt: new Date() },
      ];

      mockProductService.getPriceHistory.mockResolvedValue(expectedResult);

      const result = await controller.getPriceHistory(productId);

      expect(productService.getPriceHistory).toHaveBeenCalledWith(
        productId,
        undefined,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should get product price history with currency conversion', async () => {
      const productId = '2f8d906c-0cd4-4a1b-bbee-d4a153e63347';
      const currency = 'EUR';
      const expectedResult = [
        { id: '1', productId, price: 77.99, createdAt: new Date() },
        { id: '2', productId, price: 85.99, createdAt: new Date() },
      ];

      mockProductService.getPriceHistory.mockResolvedValue(expectedResult);

      const result = await controller.getPriceHistory(productId, currency);

      expect(productService.getPriceHistory).toHaveBeenCalledWith(
        productId,
        currency,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
