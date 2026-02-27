import { ApiProperty } from '@nestjs/swagger';

export class SalesSummaryResponseDto {
  @ApiProperty()
  totalSalesAmount!: number;

  @ApiProperty()
  totalSalesCount!: number;

  @ApiProperty()
  totalItemsSold!: number;

  @ApiProperty()
  cancelledSalesCount!: number;
}
