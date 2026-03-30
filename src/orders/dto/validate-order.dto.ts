import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order-status.enum';

export enum ValidateOrderDecision {
  VALIDATED = OrderStatus.VALIDATED,
  WAITING_STOCK = OrderStatus.WAITING_STOCK,
  CANCELLED = OrderStatus.CANCELLED,
}

export class ValidateOrderDto {
  @ApiProperty({ enum: ValidateOrderDecision, example: ValidateOrderDecision.VALIDATED })
  @IsEnum(ValidateOrderDecision)
  decision: ValidateOrderDecision;

  @ApiPropertyOptional({
    example: 'Cliente acepta esperar reposicion hasta la proxima semana',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: '2026-04-05T15:00:00.000Z',
    description: 'Required when decision is WAITING_STOCK',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  estimatedRestockDate?: Date;
}
