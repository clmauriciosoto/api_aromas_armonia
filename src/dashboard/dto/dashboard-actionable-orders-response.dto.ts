import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../orders/entities/order-status.enum';
import { PaymentMethod } from '../../orders/entities/payment-method.enum';

export class DashboardActionableOrderDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @ApiProperty()
  itemsCount!: number;

  @ApiProperty()
  ageHours!: number;
}

export class DashboardActionableOrdersResponseDto {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [DashboardActionableOrderDto] })
  data!: DashboardActionableOrderDto[];
}