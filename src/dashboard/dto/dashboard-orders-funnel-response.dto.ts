import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../orders/entities/order-status.enum';

class DashboardRangeDto {
  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;
}

export class DashboardOrdersFunnelStageDto {
  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  count!: number;

  @ApiProperty({ nullable: true })
  conversionFromPrevious!: number | null;
}

export class DashboardOrdersFunnelResponseDto {
  @ApiProperty({ type: DashboardRangeDto })
  range!: DashboardRangeDto;

  @ApiProperty()
  generatedAt!: string;

  @ApiProperty({ type: [DashboardOrdersFunnelStageDto] })
  stages!: DashboardOrdersFunnelStageDto[];

  @ApiProperty({ type: [DashboardOrdersFunnelStageDto] })
  exits!: DashboardOrdersFunnelStageDto[];
}