import { ApiProperty } from '@nestjs/swagger';
import { InventoryMovementType } from '../entities/inventory-movement-type.enum';

export class SalesInventoryMovementResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ enum: InventoryMovementType })
  type!: InventoryMovementType;

  @ApiProperty()
  quantityChange!: number;

  @ApiProperty()
  previousQuantity!: number;

  @ApiProperty()
  newQuantity!: number;

  @ApiProperty({ nullable: true })
  saleId!: string | null;

  @ApiProperty({ nullable: true })
  note!: string | null;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;
}
