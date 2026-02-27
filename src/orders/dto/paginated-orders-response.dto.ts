import { ApiProperty } from '@nestjs/swagger';
import { OrderListItemDto } from './order-list-item.dto';

class OrdersPaginationMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedOrdersResponseDto {
  @ApiProperty({ type: () => [OrderListItemDto] })
  data: OrderListItemDto[];

  @ApiProperty({ type: () => OrdersPaginationMetaDto })
  meta: OrdersPaginationMetaDto;
}
