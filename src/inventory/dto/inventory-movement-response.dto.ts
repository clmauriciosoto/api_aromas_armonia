import { ApiProperty } from '@nestjs/swagger';
import { InventoryBatchMovementType } from '../entities/inventory-batch-movement-type.enum';

export class InventoryMovementItemResponseDto {
  @ApiProperty({ example: 'f4f8f27d-ecaf-4490-a88a-315ec8df3280' })
  id!: string;

  @ApiProperty({ example: 1 })
  productId!: number;

  @ApiProperty({ example: 'Elegance Noir' })
  productName!: string;

  @ApiProperty({ example: 20 })
  quantity!: number;

  @ApiProperty({ example: 120 })
  previousQuantity!: number;

  @ApiProperty({ example: 140 })
  newQuantity!: number;
}

export class InventoryMovementResponseDto {
  @ApiProperty({ example: '79fab01b-cf07-4d28-bf6f-255f80244f8f' })
  id!: string;

  @ApiProperty({ enum: InventoryBatchMovementType, example: 'IN' })
  type!: InventoryBatchMovementType;

  @ApiProperty({ example: 'f9d74b35-ef90-4dc5-96fa-8a8e76423c2f' })
  createdBy!: string;

  @ApiProperty({ example: '2026-03-23T14:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: [InventoryMovementItemResponseDto] })
  items!: InventoryMovementItemResponseDto[];
}
