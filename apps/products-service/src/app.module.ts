import { Module } from '@nestjs/common';
import { ProductModule } from './modules/product/product.module';
import { MigrationService, SharedModule } from '@repo/shared';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    SharedModule,
    ProductModule,
  ],
  controllers: [],
  providers: [MigrationService],
})
export class AppModule {}
