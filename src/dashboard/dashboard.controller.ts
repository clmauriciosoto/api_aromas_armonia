import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRole } from '../users/entities/admin.entity';
import { DashboardService } from './dashboard.service';
import { DashboardAlertsQueryDto } from './dto/dashboard-alerts-query.dto';
import { DashboardAlertsResponseDto } from './dto/dashboard-alerts-response.dto';
import { DashboardActionableOrdersQueryDto } from './dto/dashboard-actionable-orders-query.dto';
import { DashboardActionableOrdersResponseDto } from './dto/dashboard-actionable-orders-response.dto';
import { DashboardWaitingStockOrdersQueryDto } from './dto/dashboard-waiting-stock-orders-query.dto';
import { DashboardWaitingStockOrdersResponseDto } from './dto/dashboard-waiting-stock-orders-response.dto';
import { DashboardInventoryOverviewResponseDto } from './dto/dashboard-inventory-overview-response.dto';
import { DashboardOrdersOverviewResponseDto } from './dto/dashboard-orders-overview-response.dto';
import { DashboardOrdersFunnelResponseDto } from './dto/dashboard-orders-funnel-response.dto';
import { DashboardProductsOverviewResponseDto } from './dto/dashboard-products-overview-response.dto';
import { DashboardLowStockQueryDto } from './dto/dashboard-low-stock-query.dto';
import { DashboardLowStockResponseDto } from './dto/dashboard-low-stock-response.dto';
import { DashboardRangeQueryDto } from './dto/dashboard-range-query.dto';
import { DashboardSalesOverviewResponseDto } from './dto/dashboard-sales-overview-response.dto';
import { DashboardSalesTimeseriesResponseDto } from './dto/dashboard-sales-timeseries-response.dto';
import { DashboardTimeseriesQueryDto } from './dto/dashboard-timeseries-query.dto';
import { DashboardTopProductsQueryDto } from './dto/dashboard-top-products-query.dto';
import { DashboardTopProductsResponseDto } from './dto/dashboard-top-products-response.dto';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN)
@ApiBearerAuth('bearer')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('sales/overview')
  @ApiOperation({ summary: 'Get dashboard sales KPIs' })
  @ApiOkResponse({ type: DashboardSalesOverviewResponseDto })
  getSalesOverview(@Query() query: DashboardRangeQueryDto) {
    return this.dashboardService.getSalesOverview(query);
  }

  @Get('sales/timeseries')
  @ApiOperation({ summary: 'Get dashboard sales timeseries' })
  @ApiOkResponse({ type: DashboardSalesTimeseriesResponseDto })
  getSalesTimeseries(@Query() query: DashboardTimeseriesQueryDto) {
    return this.dashboardService.getSalesTimeseries(query);
  }

  @Get('orders/overview')
  @ApiOperation({ summary: 'Get dashboard order workflow KPIs' })
  @ApiOkResponse({ type: DashboardOrdersOverviewResponseDto })
  getOrdersOverview(@Query() query: DashboardRangeQueryDto) {
    return this.dashboardService.getOrdersOverview(query);
  }

  @Get('orders/actionable')
  @ApiOperation({ summary: 'Get actionable orders for dashboard review queues' })
  @ApiOkResponse({ type: DashboardActionableOrdersResponseDto })
  getActionableOrders(@Query() query: DashboardActionableOrdersQueryDto) {
    return this.dashboardService.getActionableOrders(query);
  }

  @Get('orders/waiting-stock')
  @ApiOperation({ summary: 'Get waiting stock orders with missing item details' })
  @ApiOkResponse({ type: DashboardWaitingStockOrdersResponseDto })
  getWaitingStockOrders(@Query() query: DashboardWaitingStockOrdersQueryDto) {
    return this.dashboardService.getWaitingStockOrders(query);
  }

  @Get('orders/funnel')
  @ApiOperation({ summary: 'Get dashboard order funnel' })
  @ApiOkResponse({ type: DashboardOrdersFunnelResponseDto })
  getOrdersFunnel(@Query() query: DashboardRangeQueryDto) {
    return this.dashboardService.getOrdersFunnel(query);
  }

  @Get('inventory/overview')
  @ApiOperation({ summary: 'Get dashboard inventory KPIs' })
  @ApiOkResponse({ type: DashboardInventoryOverviewResponseDto })
  getInventoryOverview(@Query('lowStockThreshold') lowStockThreshold?: string) {
    return this.dashboardService.getInventoryOverview(
      lowStockThreshold ? Number(lowStockThreshold) : undefined,
    );
  }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Get low-stock products for dashboard action lists' })
  @ApiOkResponse({ type: DashboardLowStockResponseDto })
  getLowStockProducts(@Query() query: DashboardLowStockQueryDto) {
    return this.dashboardService.getLowStockProducts(query);
  }

  @Get('products/overview')
  @ApiOperation({ summary: 'Get dashboard product catalog KPIs' })
  @ApiOkResponse({ type: DashboardProductsOverviewResponseDto })
  getProductsOverview() {
    return this.dashboardService.getProductsOverview();
  }

  @Get('products/top-selling')
  @ApiOperation({ summary: 'Get top-selling products for dashboard' })
  @ApiOkResponse({ type: DashboardTopProductsResponseDto })
  getTopSellingProducts(@Query() query: DashboardTopProductsQueryDto) {
    return this.dashboardService.getTopSellingProducts(query);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get dashboard operational alerts' })
  @ApiOkResponse({ type: DashboardAlertsResponseDto })
  getAlerts(@Query() query: DashboardAlertsQueryDto) {
    return this.dashboardService.getAlerts(query);
  }
}