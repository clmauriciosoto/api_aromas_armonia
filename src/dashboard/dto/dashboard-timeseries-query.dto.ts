import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DashboardRangeQueryDto } from './dashboard-range-query.dto';

export enum DashboardGranularity {
  DAY = 'day',
  MONTH = 'month',
}

export class DashboardTimeseriesQueryDto extends DashboardRangeQueryDto {
  @ApiPropertyOptional({
    enum: DashboardGranularity,
    default: DashboardGranularity.DAY,
  })
  @IsOptional()
  @IsEnum(DashboardGranularity)
  granularity?: DashboardGranularity = DashboardGranularity.DAY;
}