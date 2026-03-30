import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment-method.enum';
import { OrderStatus } from '../entities/order-status.enum';

class OrderDetailItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 12 })
  productId: number;

  @ApiProperty({ example: 'Elegance Noir' })
  productName: string;

  @ApiProperty({ example: 2, description: 'Cantidad solicitada en la orden' })
  quantity: number;

  @ApiProperty({ example: 8, description: 'Stock disponible actual' })
  quantityAvailable: number;

  @ApiProperty({ example: 7995 })
  unitPrice: number;

  @ApiProperty({ example: 15990 })
  subtotal: number;
}

export class OrderDetailResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PAID })
  status: OrderStatus;

  @ApiProperty({ example: 15990 })
  totalAmount: number;

  @ApiProperty({
    required: false,
    nullable: true,
    example: '2026-04-05T15:00:00.000Z',
  })
  estimatedRestockDate?: Date | null;

  @ApiProperty({ example: '2026-02-26T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 'Juan' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  email: string;

  @ApiProperty({ example: '+34 912 34 56 78' })
  phone: string;

  @ApiProperty({ example: 'Calle Principal 123, Madrid, Spain' })
  address: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER })
  paymentMethod: PaymentMethod;

  @ApiProperty({ type: () => [OrderDetailItemDto] })
  items: OrderDetailItemDto[];
}
