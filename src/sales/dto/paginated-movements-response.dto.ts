import { ApiProperty } from '@nestjs/swagger';
import { SalesInventoryMovementResponseDto } from './inventory-movement-response.dto';

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
  @ApiProperty({ type: [SalesInventoryMovementResponseDto] })
  data!: SalesInventoryMovementResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
