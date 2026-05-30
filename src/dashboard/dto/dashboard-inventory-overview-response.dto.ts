import { ApiProperty } from '@nestjs/swagger';

export class DashboardInventoryOverviewResponseDto {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  lowStockThreshold!: number;

  @ApiProperty()
  trackedProductsCount!: number;

  @ApiProperty()
  totalUnitsInStock!: number;

  @ApiProperty()
  totalReservedUnits!: number;

  @ApiProperty()
  outOfStockCount!: number;

  @ApiProperty()
  lowStockCount!: number;
}