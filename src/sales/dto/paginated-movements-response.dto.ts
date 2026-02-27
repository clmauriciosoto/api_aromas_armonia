import { ApiProperty } from '@nestjs/swagger';
import { InventoryMovementResponseDto } from './inventory-movement-response.dto';

class PaginationMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedMovementsResponseDto {
  @ApiProperty({ type: [InventoryMovementResponseDto] })
  data!: InventoryMovementResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
