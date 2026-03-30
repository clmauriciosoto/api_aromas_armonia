import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrderAdjustmentItemDto {
  @ApiPropertyOptional({
    example: 99,
    description: 'ID del producto nuevo a agregar a la orden',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  addProductId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Cantidad del producto nuevo a agregar (usar junto a addProductId)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  addQuantity?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID del item en la orden a remover (omitir)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  removeItemId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID del item en la orden a ajustar cantidad',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  itemIdToAdjust?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Nueva cantidad (usar junto a itemIdToAdjust)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  newQuantity?: number;

  @ApiPropertyOptional({
    example: 42,
    description: 'ID del producto a usar como reemplazo (para reemplazar un item)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  replacementProductId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID del item a reemplazar (usar junto a replacementProductId)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  itemIdToReplace?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Cantidad del producto de reemplazo (si no se especifica, usa la cantidad original)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  replacementQuantity?: number;
}

export class OrderAdjustmentDto {
  @ApiPropertyOptional({
    type: [OrderAdjustmentItemDto],
    description: 'Lista de ajustes a realizar (omitir, cambiar cantidad, reemplazar)',
  })
  @IsOptional()
  adjustments?: OrderAdjustmentItemDto[];
}
