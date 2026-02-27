import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ProductStatus } from '../entities/product-status.enum';

export enum ProductSortBy {
  ID = 'id',
  NAME = 'name',
  PRICE = 'price',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

const toInt = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return Number(value);
};

export class GetAdminProductsQueryDto {
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
