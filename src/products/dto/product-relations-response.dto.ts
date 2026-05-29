import { ApiProperty } from '@nestjs/swagger';
import { ProductRelationType } from '../entities/product-relation-type.enum';

export class RelatedProductSummaryDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Gatillo premium' })
  name!: string;

  @ApiProperty({ example: 'gatillo-premium', nullable: true })
  slug!: string | null;

  @ApiProperty({ example: 'Accesorio para aromatizantes' })
  shortDescription!: string;

  @ApiProperty({ example: 2990, nullable: true })
  price!: number | null;

  @ApiProperty({ example: 2490, nullable: true })
  discountPrice!: number | null;

  @ApiProperty({ example: true })
  isPurchasable!: boolean;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({
    example: 'https://cdn.aromasarmonia.cl/products/gatillo-premium.jpg',
    nullable: true,
  })
  image!: string | null;
}

export class RelatedProductEntryResponseDto {
  @ApiProperty({ example: 3 })
  relationId!: number;

  @ApiProperty({ enum: ProductRelationType, example: ProductRelationType.ACCESSORY })
  relationType!: ProductRelationType;

  @ApiProperty({ example: 0 })
  displayOrder!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: RelatedProductSummaryDto })
  product!: RelatedProductSummaryDto;
}

export class ProductRelationGroupsResponseDto {
  @ApiProperty({
    type: [RelatedProductEntryResponseDto],
    example: [
      {
        relationId: 3,
        relationType: ProductRelationType.ACCESSORY,
        displayOrder: 0,
        isActive: true,
        product: {
          id: 12,
          name: 'Gatillo premium',
          slug: 'gatillo-premium',
          shortDescription: 'Accesorio para aromatizantes',
          price: 2990,
          discountPrice: null,
          isPurchasable: true,
          status: 'ACTIVE',
          image: 'https://cdn.aromasarmonia.cl/products/gatillo-premium.jpg',
        },
      },
    ],
  })
  accessories!: RelatedProductEntryResponseDto[];

  @ApiProperty({
    type: [RelatedProductEntryResponseDto],
    example: [],
  })
  recommended!: RelatedProductEntryResponseDto[];

  @ApiProperty({
    type: [RelatedProductEntryResponseDto],
    example: [],
  })
  alsoInteresting!: RelatedProductEntryResponseDto[];

  @ApiProperty({
    type: [RelatedProductEntryResponseDto],
    example: [],
  })
  refills!: RelatedProductEntryResponseDto[];
}