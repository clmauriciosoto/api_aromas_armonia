import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment-method.enum';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @ApiPropertyOptional({
    example: 'line-1',
    description: 'Stable client-side key for linking accessories to a main item',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lineKey?: string;

  @ApiPropertyOptional({
    example: 'line-1',
    description: 'Client-side key of the parent item when this line is an accessory',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  parentLineKey?: string;

  @IsNotEmpty()
  productId: number;

  @IsNotEmpty()
  quantity: number;
}

export class CreateOrderDto {
  @ArrayMinSize(1)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}