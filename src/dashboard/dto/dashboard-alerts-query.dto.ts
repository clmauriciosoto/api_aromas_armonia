import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { DashboardRangeQueryDto } from './dashboard-range-query.dto';

export class DashboardAlertsQueryDto extends DashboardRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Low stock threshold used in inventory alerts.',
    default: 10,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number = 10;

  @ApiPropertyOptional({
    description: 'Maximum number of product alerts returned in each list.',
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}