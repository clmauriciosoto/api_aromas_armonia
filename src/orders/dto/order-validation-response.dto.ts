import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderValidationItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 'Elegance Noir' })
  productName: string;

  @ApiProperty({ example: 5, description: 'Cantidad solicitada en la orden' })
  quantityRequested: number;

  @ApiProperty({ example: 12, description: 'Stock actual disponible' })
  quantityAvailable: number;

  @ApiProperty({
    example: true,
    description: 'true si la cantidad solicitada está disponible',
  })
  isAvailable: boolean;

  @ApiPropertyOptional({
    example: null,
    description: 'null si producto está disponible, mensaje si hace falta stock',
  })
  warning?: string | null;

  @ApiProperty({ example: 7995 })
  unitPrice: number;

  @ApiProperty({ example: 39975 })
  subtotal: number;
}

export class OrderValidationResponseDto {
  @ApiProperty({ example: 1 })
  orderId: number;

  @ApiProperty({
    enum: ['PENDING_VALIDATION', 'VALIDATED', 'AWAITING_PAYMENT'],
    example: 'PENDING_VALIDATION',
  })
  orderStatus: string;

  @ApiProperty({
    example: 39975,
    description: 'Monto total basado en items disponibles',
  })
  totalAmount: number;

  @ApiProperty({
    type: [OrderValidationItemDto],
    description: 'Items con información de disponibilidad',
  })
  items: OrderValidationItemDto[];

  @ApiProperty({
    example: false,
    description: 'true si todos los items están disponibles',
  })
  allItemsAvailable: boolean;

  @ApiProperty({
    example: 0,
    description: 'Cantidad de items con stock insuficiente',
  })
  itemsWithWarnings: number;

  @ApiProperty({
    example: 'Hay 1 producto con stock insuficiente. Ajusta la orden antes de continuar.',
    description: 'Resumen de problemas encontrados',
  })
  summary: string;

  @ApiProperty({
    example: ['Omitir productos con stock insuficiente', 'Reducir cantidades', 'Reemplazar por otro producto'],
    description: 'Acciones permitidas para resolver conflictos',
  })
  suggestedActions: string[];
}
