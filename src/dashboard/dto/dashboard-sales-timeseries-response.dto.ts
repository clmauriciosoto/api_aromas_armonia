import { ApiProperty } from '@nestjs/swagger';
import { DashboardGranularity } from './dashboard-timeseries-query.dto';

class DashboardRangeDto {
  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;
}

export class DashboardSalesTimeseriesPointDto {
  @ApiProperty()
  bucketStart!: string;

  @ApiProperty()
  salesAmount!: number;

  @ApiProperty()
  salesCount!: number;

  @ApiProperty()
  itemsSold!: number;
}

export class DashboardSalesTimeseriesResponseDto {
  @ApiProperty({ type: DashboardRangeDto })
  range!: DashboardRangeDto;

  @ApiProperty({ enum: DashboardGranularity })
  granularity!: DashboardGranularity;

  @ApiProperty()
  generatedAt!: string;

  @ApiProperty({ type: [DashboardSalesTimeseriesPointDto] })
  data!: DashboardSalesTimeseriesPointDto[];
}