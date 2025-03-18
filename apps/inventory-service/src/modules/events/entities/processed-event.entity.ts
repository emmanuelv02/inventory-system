import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('processed_events')
export class ProcessedEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  correlationId: string;

  @Column()
  eventType: string;

  @Column()
  entityId: string;

  @CreateDateColumn()
  createdAt: Date;
}
