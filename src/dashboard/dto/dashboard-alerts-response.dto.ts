import { ApiProperty } from '@nestjs/swagger';

class DashboardRangeDto {
  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;
}

export class DashboardAlertProductDto {
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
}

export class DashboardAlertsResponseDto {
  @ApiProperty({ type: DashboardRangeDto })
  range!: DashboardRangeDto;

  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  lowStockThreshold!: number;

  @ApiProperty()
  pendingValidationOrders!: number;

  @ApiProperty()
  waitingStockOrders!: number;

  @ApiProperty()
  cancelledSalesCount!: number;

  @ApiProperty({ type: [DashboardAlertProductDto] })
  outOfStockProducts!: DashboardAlertProductDto[];

  @ApiProperty({ type: [DashboardAlertProductDto] })
  lowStockProducts!: DashboardAlertProductDto[];
}