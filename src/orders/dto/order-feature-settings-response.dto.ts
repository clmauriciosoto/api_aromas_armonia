import { ApiProperty } from '@nestjs/swagger';

export class OrderFeatureSettingsResponseDto {
  @ApiProperty({
    description: 'Whether cart actions are enabled for customers',
    example: true,
  })
  cartEnabled: boolean;

  @ApiProperty({
    description: 'Whether checkout/confirm order is enabled',
    example: true,
  })
  checkoutEnabled: boolean;
}
