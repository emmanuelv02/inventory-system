import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ExchangeService {
  constructor(private readonly httpService: HttpService) {}

  async getExchangeRate(targetCurrency: string) {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const baseCurrency = process.env.BASE_CURRENCY;

    try {
      const response: ExchageApiResponse = await lastValueFrom(
        this.httpService.get(
          `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`,
        ),
      );

      return response.data.conversion_rates[targetCurrency.toUpperCase()];
    } catch {
      console.error('Error fetching exchange rate');
      return 1;
    }
  }
}

interface ExchageApiResponse {
  data: { conversion_rates: { [key: string]: number } };
}
