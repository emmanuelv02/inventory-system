import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('product_movements')
export class ProductMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column('integer')
  quantity: number;

  @Column({ nullable: true })
  description?: string;

  @Column('integer')
  newQuantity: number;

  @CreateDateColumn()
  createdAt: Date;
}
