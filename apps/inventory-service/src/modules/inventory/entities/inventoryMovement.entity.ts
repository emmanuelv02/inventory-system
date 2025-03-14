import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column('integer')
  quantity: number;

  @Column()
  description: string;

  @Column('integer')
  newQuantity: number;

  @CreateDateColumn()
  createdAt: Date;
}
