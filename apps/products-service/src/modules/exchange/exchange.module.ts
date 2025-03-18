import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
