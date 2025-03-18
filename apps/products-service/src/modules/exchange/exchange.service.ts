import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CacheService } from '@repo/shared';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ExchangeService {
  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
  ) {}

  async getExchangeRate(targetCurrency: string): Promise<number> {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const baseCurrency = process.env.BASE_CURRENCY;
    const cacheKey = `exchange:${targetCurrency}`;

    try {
      const cachedResult = await this.cacheService.get<number>(cacheKey);

      if (cachedResult) return cachedResult;

      const response: ExchageApiResponse = await lastValueFrom(
        this.httpService.get(
          `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`,
        ),
      );

      const result =
        response.data.conversion_rates[targetCurrency.toUpperCase()];

      await this.cacheService.set<number>(cacheKey, result);

      return result;
    } catch {
      console.error('Error fetching exchange rate');
      return 1;
    }
  }
}

interface ExchageApiResponse {
  data: { conversion_rates: { [key: string]: number } };
}
