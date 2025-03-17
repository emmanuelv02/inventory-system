import { Test, TestingModule } from '@nestjs/testing';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.CACHE_EX_SECS = '120';

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return parsed data when key exists', async () => {
      const testData = { name: 'test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.get('test-key');

      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(mockRedis.get).toHaveBeenCalledWith('non-existent-key');
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

      expect(mockRedis.set).toHaveBeenCalledWith(
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

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
        'EX',
        60,
      );
      expect(result).toBe('OK');

      process.env.CACHE_EX_SECS = originalEnv;
    });
  });

  describe('deleteKeysByPattern', () => {
    it('should delete keys that match the pattern', async () => {
      const keys = ['test-key1', 'test-key2'];
      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.del.mockResolvedValue(2);

      const result = await service.deleteKeysByPattern('test-*');

      expect(mockRedis.keys).toHaveBeenCalledWith('test-*');
      expect(mockRedis.del).toHaveBeenCalledWith(keys);
      expect(result).toBe(2);
    });

    it('should return 0 when no keys match the pattern', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await service.deleteKeysByPattern('non-existent-*');

      expect(mockRedis.keys).toHaveBeenCalledWith('non-existent-*');
      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });
});
