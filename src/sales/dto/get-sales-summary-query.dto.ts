import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class GetSalesSummaryQueryDto {
  @ApiPropertyOptional({ description: 'ISO 8601 start datetime' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 end datetime' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
