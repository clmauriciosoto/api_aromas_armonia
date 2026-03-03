import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../users/entities/admin.entity';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { PaginatedOrdersResponseDto } from './dto/paginated-orders-response.dto';
import { OrderStatus } from './entities/order-status.enum';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { UpdateOrderFeatureSettingsDto } from './dto/update-order-feature-settings.dto';
import { OrderFeatureSettingsResponseDto } from './dto/order-feature-settings-response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id?: string;
    sub?: string;
    role: string;
  };
}

@ApiTags('admin-orders')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN)
@ApiBearerAuth('bearer')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Get cart/checkout feature flags (admin)' })
  @ApiOkResponse({
    description: 'Current feature flags',
    type: OrderFeatureSettingsResponseDto,
  })
  @Get('settings')
  getSettings() {
    return this.ordersService.getFeatureSettings();
  }

  @ApiOperation({ summary: 'Update cart/checkout feature flags (admin)' })
  @ApiOkResponse({
    description: 'Updated feature flags',
    type: OrderFeatureSettingsResponseDto,
  })
  @Patch('settings')
  updateSettings(@Body() payload: UpdateOrderFeatureSettingsDto) {
    return this.ordersService.updateFeatureSettings(payload);
  }

  @ApiOperation({
    summary: 'List orders with pagination and filters (admin)',
    description:
      'Returns paginated orders for admin users. Supports status and createdAt date-range filtering.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Maximum value is 100',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Filter by order status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'ISO 8601 start datetime filter (createdAt >= startDate)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'ISO 8601 end datetime filter (createdAt <= endDate)',
  })
  @ApiOkResponse({
    description: 'Paginated orders list',
    type: PaginatedOrdersResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - missing or invalid JWT access token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - admin role required',
  })
  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() query: GetOrdersQueryDto) {
    return this.ordersService.findAll(req.user, query);
  }

  @ApiOperation({ summary: 'Get order detail by ID (admin)' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Order ID (integer)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Order detail retrieved successfully',
    type: OrderDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid order ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.findOneById(id, req.user);
  }
}
