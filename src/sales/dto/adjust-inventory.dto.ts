import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({
    example: -3,
    description:
      'Signed quantity delta. Positive adds stock, negative removes stock.',
  })
  @IsInt()
  quantityChange!: number;

  @ApiPropertyOptional({ example: 'Ajuste por conteo físico' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  note?: string;
}
