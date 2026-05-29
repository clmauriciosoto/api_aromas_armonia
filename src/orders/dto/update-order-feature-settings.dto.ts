import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsOptional } from 'class-validator';

export class UpdateOrderFeatureSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable/disable cart in frontend',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  cartEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable order confirmation (checkout)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  checkoutEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable notifications when a new order is created',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notifyNewOrderEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Email recipients notified when a new order needs review',
    example: ['ops@aromasarmonia.cl', 'ventas@aromasarmonia.cl'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  notifyNewOrderRecipients?: string[];
}
