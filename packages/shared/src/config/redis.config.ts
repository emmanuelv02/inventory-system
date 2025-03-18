import { RedisModuleOptions } from '@nestjs-modules/ioredis';

export const redisConfiguration: RedisModuleOptions = {
  type: 'single',
  url: process.env.REDIS_HOST,
};
