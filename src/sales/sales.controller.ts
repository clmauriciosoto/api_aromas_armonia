import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../users/entities/admin.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { RestockInventoryDto } from './dto/restock-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { SalesInventoryMovementResponseDto } from './dto/inventory-movement-response.dto';
import { GetSalesQueryDto } from './dto/get-sales-query.dto';
import { PaginatedSalesResponseDto } from './dto/paginated-sales-response.dto';
import { GetMovementsQueryDto } from './dto/get-movements-query.dto';
import { PaginatedMovementsResponseDto } from './dto/paginated-movements-response.dto';
import { GetSalesSummaryQueryDto } from './dto/get-sales-summary-query.dto';
import { SalesSummaryResponseDto } from './dto/sales-summary-response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id?: string;
    sub?: string;
    role: string;
  };
}

@ApiTags('Admin Sales & Ledger')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN)
@ApiBearerAuth('bearer')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('sales')
  @ApiOperation({ summary: 'Create local sale and discount inventory' })
  @ApiCreatedResponse({ type: SaleResponseDto })
  createSale(
    @Body() dto: CreateSaleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SaleResponseDto> {
    return this.salesService.createSale(dto, req.user);
  }

  @Post('sales/from-order/:orderId')
  @ApiOperation({ summary: 'Create sale from an existing order' })
  @ApiCreatedResponse({ type: SaleResponseDto })
  createSaleFromOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<SaleResponseDto> {
    return this.salesService.createSaleFromOrder(orderId, req.user);
  }

  @Post('sales/:id/cancel')
  @ApiOperation({ summary: 'Cancel sale and reverse inventory movement' })
  @ApiOkResponse({ type: SaleResponseDto })
  cancelSale(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SaleResponseDto> {
    return this.salesService.cancelSale(id, req.user);
  }

  @Post('inventory/restock')
  @ApiOperation({ summary: 'Register restock inventory movement' })
  @ApiCreatedResponse({ type: SalesInventoryMovementResponseDto })
  restockInventory(
    @Body() dto: RestockInventoryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SalesInventoryMovementResponseDto> {
    return this.salesService.restockInventory(dto, req.user);
  }

  @Post('inventory/adjust')
  @ApiOperation({ summary: 'Register manual stock adjustment movement' })
  @ApiCreatedResponse({ type: SalesInventoryMovementResponseDto })
  adjustInventory(
    @Body() dto: AdjustInventoryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SalesInventoryMovementResponseDto> {
    return this.salesService.adjustInventory(dto, req.user);
  }

  @Get('sales')
  @ApiOperation({ summary: 'List sales with pagination and filters' })
  @ApiOkResponse({ type: PaginatedSalesResponseDto })
  findSales(
    @Query() query: GetSalesQueryDto,
  ): Promise<PaginatedSalesResponseDto> {
    return this.salesService.findSales(query);
  }

  @Get('sales/:id')
  @ApiOperation({ summary: 'Get sale detail by ID' })
  @ApiOkResponse({ type: SaleResponseDto })
  findSaleById(@Param('id') id: string): Promise<SaleResponseDto> {
    return this.salesService.findSaleById(id);
  }

  @Get('inventory/movements')
  @ApiOperation({ summary: 'List inventory movement ledger' })
  @ApiOkResponse({ type: PaginatedMovementsResponseDto })
  findMovements(
    @Query() query: GetMovementsQueryDto,
  ): Promise<PaginatedMovementsResponseDto> {
    return this.salesService.findMovements(query);
  }

  @Get('reports/sales-summary')
  @ApiOperation({ summary: 'Get sales summary report' })
  @ApiOkResponse({ type: SalesSummaryResponseDto })
  getSalesSummary(
    @Query() query: GetSalesSummaryQueryDto,
  ): Promise<SalesSummaryResponseDto> {
    return this.salesService.getSalesSummary(query);
  }
}
