import { ApiProperty } from '@nestjs/swagger';

class DashboardRangeDto {
  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;
}

class DashboardComparisonMetricDto {
  @ApiProperty()
  current!: number;

  @ApiProperty()
  previous!: number;

  @ApiProperty({ nullable: true })
  delta!: number | null;

  @ApiProperty({ nullable: true })
  deltaPercent!: number | null;
}

export class DashboardSalesOverviewResponseDto {
  @ApiProperty({ type: DashboardRangeDto })
  range!: DashboardRangeDto;

  @ApiProperty({ type: DashboardRangeDto })
  previousRange!: DashboardRangeDto;

  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  totalSalesAmount!: number;

  @ApiProperty()
  totalSalesCount!: number;

  @ApiProperty()
  totalItemsSold!: number;

  @ApiProperty()
  cancelledSalesCount!: number;

  @ApiProperty()
  averageTicket!: number;

  @ApiProperty({ type: DashboardComparisonMetricDto })
  salesAmountComparison!: DashboardComparisonMetricDto;

  @ApiProperty({ type: DashboardComparisonMetricDto })
  salesCountComparison!: DashboardComparisonMetricDto;

  @ApiProperty({ type: DashboardComparisonMetricDto })
  itemsSoldComparison!: DashboardComparisonMetricDto;
}