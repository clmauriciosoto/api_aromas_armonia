import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { InventoryBatchMovementType } from '../entities/inventory-batch-movement-type.enum';

export class GetInventoryMovementsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: InventoryBatchMovementType })
  @IsOptional()
  @IsEnum(InventoryBatchMovementType)
  type?: InventoryBatchMovementType;

  @ApiPropertyOptional({ description: 'Creator admin ID (UUID)' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 start datetime' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 end datetime' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
