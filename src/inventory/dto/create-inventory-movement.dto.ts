import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InventoryBatchMovementType } from '../entities/inventory-batch-movement-type.enum';

export class CreateInventoryMovementProductDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateInventoryMovementDto {
  @ApiProperty({ enum: InventoryBatchMovementType, example: 'IN' })
  @IsEnum(InventoryBatchMovementType)
  type!: InventoryBatchMovementType;

  @ApiProperty({ type: [CreateInventoryMovementProductDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryMovementProductDto)
  products!: CreateInventoryMovementProductDto[];
}
