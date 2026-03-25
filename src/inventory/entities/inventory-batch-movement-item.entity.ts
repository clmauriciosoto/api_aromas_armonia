import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { InventoryBatchMovement } from './inventory-batch-movement.entity';

@Entity('inventory_batch_movement_items')
@Index(['movementId'])
@Index(['productId'])
@Check('CHK_INVENTORY_BATCH_ITEM_QUANTITY_POSITIVE', '"quantity" > 0')
export class InventoryBatchMovementItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  movementId!: string;

  @ManyToOne(() => InventoryBatchMovement, (movement) => movement.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'movementId' })
  movement!: InventoryBatchMovement;

  @Column({ type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'int' })
  quantity!: number;
}
