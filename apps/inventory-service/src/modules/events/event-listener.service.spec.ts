import { Test, TestingModule } from '@nestjs/testing';
import { ProductEventsListener } from './product-events.listener';

describe('ProductEventsListener', () => {
  let service: ProductEventsListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductEventsListener],
    }).compile();

    service = module.get<ProductEventsListener>(ProductEventsListener);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
