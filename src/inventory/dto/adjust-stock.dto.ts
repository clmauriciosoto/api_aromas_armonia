import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({
    description: 'Stock adjustment amount. Positive increases stock, negative decreases stock.',
    example: -5,
  })
  @IsInt()
  adjustment: number;
}
