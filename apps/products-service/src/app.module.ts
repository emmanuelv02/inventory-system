import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';
import { ProductModule } from './modules/product/product.module';
import { APP_GUARD } from '@nestjs/core';
import {
  AuthModule,
  CacheModule,
  JwtAuthGuard,
  RolesGuard,
} from '@repo/shared';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    CacheModule,
    ProductModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
