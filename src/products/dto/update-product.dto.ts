import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductStatus } from '../entities/product-status.enum';

export class UpdateProductImageDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsInt()
  @Min(0)
  position!: number;

  @IsBoolean()
  isPrimary!: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountPrice?: number | null;

  @IsOptional()
  @IsString()
  vendorCode?: string | null;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  isPurchasable?: boolean;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @IsIn(['CLP'])
  currency?: string;

  @IsOptional()
  @ArrayUnique()
  @IsInt({ each: true })
  attributeIds?: number[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductImageDto)
  images?: UpdateProductImageDto[];

  @IsOptional()
  @IsBoolean()
  regenerateSlug?: boolean;
}
