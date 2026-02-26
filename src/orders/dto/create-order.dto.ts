import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from '../entities/payment-method.enum';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsNotEmpty()
  productId: number;

  @IsNotEmpty()
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
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