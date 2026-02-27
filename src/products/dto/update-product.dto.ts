import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ProductStatus } from '../entities/product-status.enum';

export class UpdateProductDto extends PartialType(CreateProductDto) {
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
}
