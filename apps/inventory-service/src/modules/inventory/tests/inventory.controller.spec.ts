/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from '../inventory.controller';
import { InventoryService } from '../inventory.service';
import { RegisterInventoryDto } from '../dtos/registerInventory.dto';

describe('InventoryController', () => {
  let controller: InventoryController;
  let inventoryService: InventoryService;

  // Create mock for InventoryService
  const mockInventoryService = {
    getProductStock: jest.fn(),
    registerInventory: jest.fn(),
    getProductMovements: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStock', () => {
    it('should call inventoryService.getProductStock with the correct productId', async () => {
      const productId = '2f8d906c-0cd4-4a1b-bbee-d4a153e63347';
      const mockStock = {
        productId,
        productName: 'Test Product',
        quantity: 10,
      };

      mockInventoryService.getProductStock.mockResolvedValue(mockStock);

      const result = await controller.getStock(productId);

      expect(inventoryService.getProductStock).toHaveBeenCalledWith(productId);
      expect(result).toEqual(mockStock);
    });
  });

  describe('registerInventory', () => {
    it('should call inventoryService.registerInventory with the correct DTO', async () => {
      const registerDto: RegisterInventoryDto = {
        productId: '2f8d906c-0cd4-4a1b-bbee-d4a153e63347',
        quantity: 5,
        description: 'Adding stock',
      };

      mockInventoryService.registerInventory.mockResolvedValue(undefined);

      await controller.registerInventory(registerDto);

      expect(inventoryService.registerInventory).toHaveBeenCalledWith(
        registerDto,
      );
    });
  });

  describe('getProductMovements', () => {
    it('should call inventoryService.getProductMovements with the correct productId', async () => {
      const productId = '2f8d906c-0cd4-4a1b-bbee-d4a153e63347';
      const mockMovements = [
        {
          id: '1',
          productId,
          quantity: 10,
          newQuantity: 10,
          description: 'Initial stock',
          createdAt: new Date(),
        },
        {
          id: '2',
          productId,
          quantity: 5,
          newQuantity: 15,
          description: 'Adding stock',
          createdAt: new Date(),
        },
      ];

      mockInventoryService.getProductMovements.mockResolvedValue(mockMovements);

      const result = await controller.getProductMovements(productId);

      expect(inventoryService.getProductMovements).toHaveBeenCalledWith(
        productId,
      );
      expect(result).toEqual(mockMovements);
    });
  });
});
