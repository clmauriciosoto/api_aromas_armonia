import { ApiProperty } from '@nestjs/swagger';

export class DashboardProductsOverviewResponseDto {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  totalProducts!: number;

  @ApiProperty()
  activeProducts!: number;

  @ApiProperty()
  inactiveProducts!: number;

  @ApiProperty()
  archivedProducts!: number;

  @ApiProperty()
  purchasableProducts!: number;

  @ApiProperty()
  nonPurchasableProducts!: number;

  @ApiProperty()
  withoutStockProducts!: number;
}