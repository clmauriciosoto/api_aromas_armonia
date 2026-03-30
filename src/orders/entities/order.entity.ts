import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.enum';
import { PaymentMethod } from './payment-method.enum';
import { OrderStatusHistoryEntry } from './order-status-history-entry.type';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_VALIDATION,
  })
  status: OrderStatus;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  statusHistory: OrderStatusHistoryEntry[];

  @Column('int')
  totalAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  estimatedRestockDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethodSelected: PaymentMethod | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
