import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Attribute } from '../../attributes/entities/attribute.entity';

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

  @Column('int')
  discountPrice: number;

  @Column('int')
  price: number;

  @Column()
  image: string;

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
