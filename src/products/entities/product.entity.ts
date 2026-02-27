import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Attribute } from '../../attributes/entities/attribute.entity';
import { ProductImage } from './product-image.entity';
import { ProductStatus } from './product-status.enum';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  shortDescription: string;

  @Column()
  description: string;

  @Column('int', { nullable: true })
  // @deprecated - maintained for backward compatibility
  discountPrice: number | null;

  @Column('int', { nullable: true })
  // @deprecated - maintained for backward compatibility
  price: number | null;

  @Column({ type: 'varchar', nullable: true })
  // @deprecated - maintained for backward compatibility
  image: string | null;

  @Column({ type: 'varchar', nullable: true })
  vendorCode: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  slug: string | null;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Column({ default: true })
  isPurchasable: boolean;

  @Column({ type: 'varchar', length: 3, default: 'CLP' })
  currency: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToMany(() => Attribute, (attribute) => attribute.products)
  @JoinTable({
    name: 'product_attributes', // nombre de la tabla intermedia
    joinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'attribute_id',
      referencedColumnName: 'id',
    },
  })
  attributes: Attribute[];

  @OneToMany(() => ProductImage, (productImage) => productImage.product)
  images: ProductImage[];
}
/*  {
    id: 1,
    name: "Elegance Noir",
    price: 189,
    originalPrice: 229,
    description: "A sophisticated blend of bergamot, jasmine, and sandalwood",
    image: "/src/assets/hero-perfume.jpg",
    rating: 4.8,
    reviews: 124,
    category: "Women",
    inStock: true,
    isBestseller: true,
    attributes: ["Refillable with Elegance Noir Refill", "Long-lasting formula (8-12 hours)"],
    accessories: [
      { id: "trigger-1", name: "Premium Spray Trigger", price: 25, description: "Precision spray mechanism for even application", image: "/src/assets/hero-perfume.jpg" }
    ]
  }, */
