import { ApiProperty } from '@nestjs/swagger';

export class SaleItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty()
  subtotal!: number;
}
