import { ApiProperty } from '@nestjs/swagger';

export class DashboardLowStockProductDto {
  @ApiProperty({ nullable: true })
  id!: string | null;

  @ApiProperty()
  productId!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ nullable: true })
  vendorCode!: string | null;

  @ApiProperty({ nullable: true })
  barcode!: string | null;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({
    description: 'Alias of quantity for frontend compatibility.',
  })
  stock!: number;

  @ApiProperty()
  reservedQuantity!: number;

  @ApiProperty()
  availableToSell!: number;

  @ApiProperty({ nullable: true })
  updatedAt!: Date | null;
}

export class DashboardLowStockResponseDto {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  lowStockThreshold!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [DashboardLowStockProductDto] })
  data!: DashboardLowStockProductDto[];
}