import { ApiProperty } from '@nestjs/swagger';
import { SaleResponseDto } from './sale-response.dto';

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

export class PaginatedSalesResponseDto {
  @ApiProperty({ type: [SaleResponseDto] })
  data!: SaleResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
