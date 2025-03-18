import {v4} from 'uuid';

export enum ProductEventType {
  CREATED = 'product.created',
  UPDATED = 'product.updated',
  DELETED = 'product.deleted',
}

export class ProductEvent {
  constructor(product: Product, eventType: ProductEventType) {
    this.id = product.id;
    this.product = product;
    this.type = eventType;
    this.metadata = {correlationId: v4()};
  }

  id: string;
  type: ProductEventType;
  product: Product;
  metadata: {
    correlationId: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  createdAt: Date;
  updatedAt: Date;
}
