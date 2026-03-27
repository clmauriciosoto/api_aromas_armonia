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
import { OrderStatus } from '../../orders/entities/order-status.enum';
import { Admin } from '../../users/entities/admin.entity';

@Entity('sales')
@Index(['createdAt'])
@Index(['status'])
@Index(['type'])
@Index('UQ_sales_orderId_not_null', ['orderId'], {
  unique: true,
  where: '"orderId" IS NOT NULL',
})
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Número de venta secuencial autogenerado por la base de datos.
   * No se incluye en INSERT; el valor lo asigna la secuencia de PostgreSQL.
   */
  @Index({ unique: true })
  @Column({ type: 'int', insert: false, update: false, nullable: false })
  saleNumber!: number;

  /**
   * Número de documento (ej. boleta SII). Único, no secuencial y opcional.
   */
  @Index({ unique: true, where: '"documentNumber" IS NOT NULL' })
  @Column({ type: 'int', nullable: true, unique: true })
  documentNumber!: number | null;

  @Column({ type: 'enum', enum: SaleType })
  type!: SaleType;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status!: SaleStatus;

  @Column({ type: 'int', nullable: true })
  orderId!: number | null;

  @Column({ type: 'enum', enum: OrderStatus, nullable: true })
  orderStatusBeforeSale!: OrderStatus | null;

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
