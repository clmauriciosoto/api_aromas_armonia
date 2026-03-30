import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderItemStatus } from './order-item-status.enum';
import { OrderItemChangeHistoryEntry } from './order-item-change-history-entry.type';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column('int')
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column('int')
  quantity: number;

  @Column('int')
  unitPrice: number;

  @Column('int')
  subtotal: number;

  @Column({
    type: 'enum',
    enum: OrderItemStatus,
    default: OrderItemStatus.ACTIVE,
  })
  status: OrderItemStatus;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  changeHistory: OrderItemChangeHistoryEntry[];
}
