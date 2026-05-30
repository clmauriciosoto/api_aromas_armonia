import { ApiProperty } from '@nestjs/swagger';

export class DashboardWaitingStockMissingItemDto {
  @ApiProperty()
  orderItemId!: number;

  @ApiProperty()
  productId!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ nullable: true })
  vendorCode!: string | null;

  @ApiProperty({ nullable: true })
  barcode!: string | null;

  @ApiProperty()
  quantityRequested!: number;

  @ApiProperty()
  quantityAvailable!: number;

  @ApiProperty()
  shortage!: number;
}

export class DashboardWaitingStockOrderDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  missingItemsCount!: number;

  @ApiProperty()
  totalUnitsShort!: number;

  @ApiProperty({ type: [DashboardWaitingStockMissingItemDto] })
  missingItems!: DashboardWaitingStockMissingItemDto[];
}

export class DashboardWaitingStockOrdersResponseDto {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [DashboardWaitingStockOrderDto] })
  data!: DashboardWaitingStockOrderDto[];
}