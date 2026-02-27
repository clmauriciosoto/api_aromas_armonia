import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Sale } from './sale.entity';
import { Admin } from '../../users/entities/admin.entity';
import { InventoryMovementType } from './inventory-movement-type.enum';

@Entity('inventory_movements')
@Index(['productId'])
@Index(['saleId'])
@Index(['type'])
@Index(['createdAt'])
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'enum', enum: InventoryMovementType })
  type!: InventoryMovementType;

  @Column({ type: 'int' })
  quantityChange!: number;

  @Column({ type: 'int' })
  previousQuantity!: number;

  @Column({ type: 'int' })
  newQuantity!: number;

  @Column({ type: 'uuid', nullable: true })
  saleId!: string | null;

  @ManyToOne(() => Sale, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'saleId' })
  sale!: Sale | null;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => Admin, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdBy' })
  creator!: Admin;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
