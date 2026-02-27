import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaleType } from './sale-type.enum';
import { SaleStatus } from './sale-status.enum';
import { SaleItem } from './sale-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { Admin } from '../../users/entities/admin.entity';

@Entity('sales')
@Index(['createdAt'])
@Index(['status'])
@Index(['type'])
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: SaleType })
  type!: SaleType;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status!: SaleStatus;

  @Column({ type: 'int', nullable: true })
  orderId!: number | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order!: Order | null;

  @Column({ type: 'varchar', nullable: true })
  customerName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  customerEmail!: string | null;

  @Column({ type: 'int' })
  totalAmount!: number;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items!: SaleItem[];

  @Column({ type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => Admin, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdBy' })
  creator!: Admin;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
