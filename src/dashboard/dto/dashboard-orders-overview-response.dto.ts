import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../orders/entities/order-status.enum';

class DashboardRangeDto {
  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;
}

class DashboardComparisonMetricDto {
  @ApiProperty()
  current!: number;

  @ApiProperty()
  previous!: number;

  @ApiProperty({ nullable: true })
  delta!: number | null;

  @ApiProperty({ nullable: true })
  deltaPercent!: number | null;
}

export class DashboardOrderStatusCountDto {
  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty()
  count!: number;
}

export class DashboardOrdersOverviewResponseDto {
  @ApiProperty({ type: DashboardRangeDto })
  range!: DashboardRangeDto;

  @ApiProperty({ type: DashboardRangeDto })
  previousRange!: DashboardRangeDto;

  @ApiProperty()
  generatedAt!: string;

  @ApiProperty()
  totalOrders!: number;

  @ApiProperty()
  pendingValidationCount!: number;

  @ApiProperty()
  waitingStockCount!: number;

  @ApiProperty()
  awaitingPaymentCount!: number;

  @ApiProperty()
  paidCount!: number;

  @ApiProperty()
  completedFlowCount!: number;

  @ApiProperty({ type: [DashboardOrderStatusCountDto] })
  statuses!: DashboardOrderStatusCountDto[];

  @ApiProperty({ type: DashboardComparisonMetricDto })
  totalOrdersComparison!: DashboardComparisonMetricDto;

  @ApiProperty({ type: DashboardComparisonMetricDto })
  pendingValidationComparison!: DashboardComparisonMetricDto;

  @ApiProperty({ type: DashboardComparisonMetricDto })
  waitingStockComparison!: DashboardComparisonMetricDto;
}