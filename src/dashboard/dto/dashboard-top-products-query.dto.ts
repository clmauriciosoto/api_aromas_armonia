import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { DashboardRangeQueryDto } from './dashboard-range-query.dto';

export class DashboardTopProductsQueryDto extends DashboardRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of products returned.',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}