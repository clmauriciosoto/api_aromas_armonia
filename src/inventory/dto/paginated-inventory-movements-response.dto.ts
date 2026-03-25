import { ApiProperty } from '@nestjs/swagger';
import { InventoryBatchMovementType } from '../entities/inventory-batch-movement-type.enum';

export class InventoryMovementListItemProductDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  quantity!: number;
}

export class InventoryMovementListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: InventoryBatchMovementType })
  type!: InventoryBatchMovementType;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: [InventoryMovementListItemProductDto] })
  items!: InventoryMovementListItemProductDto[];
}

class InventoryMovementPaginationMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedInventoryMovementsResponseDto {
  @ApiProperty({ type: [InventoryMovementListItemDto] })
  data!: InventoryMovementListItemDto[];

  @ApiProperty({ type: InventoryMovementPaginationMetaDto })
  meta!: InventoryMovementPaginationMetaDto;
}
