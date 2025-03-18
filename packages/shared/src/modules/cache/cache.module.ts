import {Global, Module} from '@nestjs/common';
import {CacheService} from './cache.service';
import {RedisModule} from '@nestjs-modules/ioredis';
import {redisConfiguration} from '../../config/redis.config';

@Global()
@Module({
  imports: [RedisModule.forRoot(redisConfiguration)],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
