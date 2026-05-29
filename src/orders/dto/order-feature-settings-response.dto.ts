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

  @ApiProperty({
    description: 'Whether internal notification is enabled for newly created orders',
    example: true,
  })
  notifyNewOrderEnabled: boolean;

  @ApiProperty({
    description: 'Email recipients to notify when a new order needs review',
    example: ['ops@aromasarmonia.cl', 'ventas@aromasarmonia.cl'],
    type: [String],
  })
  notifyNewOrderRecipients: string[];
}
