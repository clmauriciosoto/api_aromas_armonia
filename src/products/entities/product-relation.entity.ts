import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductRelationType } from './product-relation-type.enum';

@Entity({ name: 'product_relations' })
@Unique('UQ_product_relation_source_target_type', [
  'sourceProductId',
  'targetProductId',
  'relationType',
])
@Index('IDX_product_relation_source', ['sourceProductId'])
@Index('IDX_product_relation_target', ['targetProductId'])
@Index('IDX_product_relation_type', ['relationType'])
@Check('CHK_product_relation_distinct_products', '"sourceProductId" <> "targetProductId"')
export class ProductRelation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  sourceProductId!: number;

  @Column({ type: 'int' })
  targetProductId!: number;

  @Column({
    type: 'enum',
    enum: ProductRelationType,
  })
  relationType!: ProductRelationType;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => Product, (product) => product.outgoingRelations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sourceProductId' })
  sourceProduct!: Product;

  @ManyToOne(() => Product, (product) => product.incomingRelations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'targetProductId' })
  targetProduct!: Product;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}