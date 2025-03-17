import { v4 } from 'uuid';
import { ProductInventory } from '../entities/productInventory.entity';

export enum InventoryEventType {
  UPDATED = 'inventory.updated',
}

export class InventoryEvent {
  constructor(inventory: ProductInventory, eventType: InventoryEventType) {
    this.id = inventory.id;
    this.inventory = inventory;
    this.type = eventType;
    this.metadata = { correlationId: v4() };
  }

  id: string;
  type: InventoryEventType;
  inventory: ProductInventory;
  metadata: {
    correlationId: string;
  };
}
