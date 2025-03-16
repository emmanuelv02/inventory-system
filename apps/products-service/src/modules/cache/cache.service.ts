import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const cachedResult = await this.redis.get(key);
    if (cachedResult) return JSON.parse(cachedResult) as T;
    return null;
  }

  async set<T>(key: string, value: T) {
    return await this.redis.set(
      key,
      JSON.stringify(value),
      'EX',
      parseInt(process.env.CACHE_EX_SECS || '60'),
    );
  }

  async deleteKeysByPattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    return await this.redis.del(keys);
  }
}
