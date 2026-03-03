import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

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
}
