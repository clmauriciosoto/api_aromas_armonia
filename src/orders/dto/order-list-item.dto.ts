import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order-status.enum';

export class OrderListItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ example: 15990 })
  totalAmount: number;

  @ApiProperty({ example: '2026-02-26T10:30:00.000Z' })
  createdAt: Date;
}
