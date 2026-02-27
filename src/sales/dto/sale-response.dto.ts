import { ApiProperty } from '@nestjs/swagger';
import { SaleStatus } from '../entities/sale-status.enum';
import { SaleType } from '../entities/sale-type.enum';
import { SaleItemResponseDto } from './sale-item-response.dto';

export class SaleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: SaleType })
  type!: SaleType;

  @ApiProperty({ enum: SaleStatus })
  status!: SaleStatus;

  @ApiProperty({ nullable: true })
  orderId!: number | null;

  @ApiProperty({ nullable: true })
  customerName!: string | null;

  @ApiProperty({ nullable: true })
  customerEmail!: string | null;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: [SaleItemResponseDto] })
  items!: SaleItemResponseDto[];
}
