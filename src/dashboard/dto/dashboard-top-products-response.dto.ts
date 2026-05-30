import { ApiProperty } from '@nestjs/swagger';

class DashboardRangeDto {
  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;
}

export class DashboardTopSellingProductDto {
  @ApiProperty()
  productId!: number;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ nullable: true })
  vendorCode!: string | null;

  @ApiProperty({ nullable: true })
  barcode!: string | null;

  @ApiProperty()
  unitsSold!: number;

  @ApiProperty()
  revenue!: number;

  @ApiProperty()
  currentStock!: number;
}

export class DashboardTopProductsResponseDto {
  @ApiProperty({ type: DashboardRangeDto })
  range!: DashboardRangeDto;

  @ApiProperty()
  generatedAt!: string;

  @ApiProperty({ type: [DashboardTopSellingProductDto] })
  data!: DashboardTopSellingProductDto[];
}