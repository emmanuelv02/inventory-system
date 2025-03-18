/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ExchangeService } from './exchange.service';
import { CacheService } from '@repo/shared';

describe('ExchangeService', () => {
  let service: ExchangeService;
  let httpService: HttpService;
  let cacheService: CacheService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    process.env.EXCHANGE_RATE_API_KEY = 'test-api-key';
    process.env.BASE_CURRENCY = 'USD';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<ExchangeService>(ExchangeService);
    httpService = module.get<HttpService>(HttpService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExchangeRate', () => {
    it('should return cached exchange rate if available', async () => {
      mockCacheService.get.mockResolvedValue(1.25);

      const result = await service.getExchangeRate('EUR');

      expect(cacheService.get).toHaveBeenCalledWith('exchange:EUR');
      expect(httpService.get).not.toHaveBeenCalled();
      expect(result).toBe(1.25);
    });

    it('should fetch and cache exchange rate if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const mockResponse: AxiosResponse = {
        data: {
          conversion_rates: {
            EUR: 0.85,
            GBP: 0.75,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));
      mockCacheService.set.mockResolvedValue('OK');

      const result = await service.getExchangeRate('EUR');

      expect(cacheService.get).toHaveBeenCalledWith('exchange:EUR');
      expect(httpService.get).toHaveBeenCalledWith(
        'https://v6.exchangerate-api.com/v6/test-api-key/latest/USD',
      );
      expect(cacheService.set).toHaveBeenCalledWith('exchange:EUR', 0.85);
      expect(result).toBe(0.85);
    });

    it('should convert target currency to uppercase when accessing API response', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const mockResponse: AxiosResponse = {
        data: {
          conversion_rates: {
            EUR: 0.85,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getExchangeRate('eur');

      expect(result).toBe(0.85);
    });

    it('should return 1 when API call fails', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API Error')),
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getExchangeRate('EUR');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching exchange rate');
      expect(result).toBe(1);

      consoleSpy.mockRestore();
    });
  });
});
