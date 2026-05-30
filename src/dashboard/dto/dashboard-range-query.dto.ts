import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class DashboardRangeQueryDto {
  @ApiPropertyOptional({
    description: 'ISO 8601 start datetime. Defaults to 30 days before endDate.',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'ISO 8601 end datetime. Defaults to current time.',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}