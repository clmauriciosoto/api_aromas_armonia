import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admin } from '../../users/entities/admin.entity';
import { InventoryBatchMovementType } from './inventory-batch-movement-type.enum';
import { InventoryBatchMovementItem } from './inventory-batch-movement-item.entity';

@Entity('inventory_batch_movements')
@Index(['type'])
@Index(['createdAt'])
export class InventoryBatchMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: InventoryBatchMovementType })
  type!: InventoryBatchMovementType;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => Admin, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdBy' })
  creator!: Admin;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => InventoryBatchMovementItem, (item) => item.movement, {
    cascade: ['insert'],
  })
  items!: InventoryBatchMovementItem[];
}
