import { ApiProperty } from '@nestjs/swagger';
import { InventoryResponseDto } from './inventory-response.dto';

class InventoryPaginationMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedInventoryResponseDto {
  @ApiProperty({ type: () => [InventoryResponseDto] })
  data: InventoryResponseDto[];

  @ApiProperty({ type: () => InventoryPaginationMetaDto })
  meta: InventoryPaginationMetaDto;
}
