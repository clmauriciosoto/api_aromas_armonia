import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductRelationAssignmentDto {
  @ApiPropertyOptional({ example: 12, description: 'Related product ID' })
  @IsInt()
  @Min(1)
  targetProductId!: number;

  @ApiPropertyOptional({ example: 0, description: 'Sort order within its relation group' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the relation is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductRelationsDto {
  @ApiPropertyOptional({ type: [ProductRelationAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductRelationAssignmentDto)
  accessories?: ProductRelationAssignmentDto[];

  @ApiPropertyOptional({ type: [ProductRelationAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductRelationAssignmentDto)
  recommended?: ProductRelationAssignmentDto[];

  @ApiPropertyOptional({ type: [ProductRelationAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductRelationAssignmentDto)
  alsoInteresting?: ProductRelationAssignmentDto[];

  @ApiPropertyOptional({ type: [ProductRelationAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductRelationAssignmentDto)
  refills?: ProductRelationAssignmentDto[];
}