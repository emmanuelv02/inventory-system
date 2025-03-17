import { Product } from './product.interface';

export enum ProductEventType {
  CREATED = 'product.created',
  UPDATED = 'product.updated',
  DELETED = 'product.deleted',
}

export interface ProductEvent {
  id: string;
  type: ProductEventType;
  product: Product;
  metadata: {
    correlationId: string;
  };
}
