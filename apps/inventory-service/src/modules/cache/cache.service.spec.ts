/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { Redis } from 'ioredis';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';

describe('CacheService', () => {
  let service: CacheService;
  let redis: Redis;

  // Mock Redis implementation
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: getRedisConnectionToken('default'),
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redis = module.get<Redis>(getRedisConnectionToken('default'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await service.get<{ id: number; name: string }>(
        'test-key',
      );

      expect(redis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(mockData);
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(redis.get).toHaveBeenCalledWith('non-existent-key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with default expiration time', async () => {
      const originalEnv = process.env.CACHE_EX_SECS;
      process.env.CACHE_EX_SECS = '60';

      const testData = { id: 1, name: 'Test' };
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.set('test-key', testData);

      expect(redis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
        'EX',
        60,
      );
      expect(result).toBe('OK');

      process.env.CACHE_EX_SECS = originalEnv;
    });

    it('should use fallback expiration time when env var is not set', async () => {
      const originalEnv = process.env.CACHE_EX_SECS;
      delete process.env.CACHE_EX_SECS;

      const testData = { id: 1, name: 'Test' };
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.set('test-key', testData);

      expect(redis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
        'EX',
        60,
      );
      expect(result).toBe('OK');

      process.env.CACHE_EX_SECS = originalEnv;
    });
  });

  describe('deleteKeys', () => {
    it('should delete multiple keys and return number of deleted keys', async () => {
      const keysToDelete = ['key1', 'key2', 'key3'];
      mockRedis.del.mockResolvedValue(3);

      const result = await service.deleteKeys(keysToDelete);

      expect(redis.del).toHaveBeenCalledWith(keysToDelete);
      expect(result).toBe(3);
    });

    it('should return 0 when no keys are deleted', async () => {
      const keysToDelete = ['non-existent-key'];
      mockRedis.del.mockResolvedValue(0);

      const result = await service.deleteKeys(keysToDelete);

      expect(redis.del).toHaveBeenCalledWith(keysToDelete);
      expect(result).toBe(0);
    });
  });
});
