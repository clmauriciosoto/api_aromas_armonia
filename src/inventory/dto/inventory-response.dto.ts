import { ApiProperty } from '@nestjs/swagger';

export class InventoryResponseDto {
  @ApiProperty({
    example: '13f49e8f-28af-41d4-9ac2-b8ab212bf1a4',
  })
  id: string;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ example: 'Elegance Noir' })
  productName: string;

  @ApiProperty({ example: 120 })
  quantity: number;

  @ApiProperty({ example: '2026-02-27T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-27T10:00:00.000Z' })
  updatedAt: Date;
}
