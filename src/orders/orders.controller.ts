import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { PaginatedOrdersResponseDto } from './dto/paginated-orders-response.dto';
import { OrderStatus } from './entities/order-status.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id?: string;
    sub?: string;
    role: string;
  };
}

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List orders with pagination and filters',
    description:
      'Returns paginated orders for authenticated admin users. Supports status and createdAt date-range filtering.',
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
    description:
      'Forbidden - non-admin users cannot list orders until ownership mapping is implemented',
  })
  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() query: GetOrdersQueryDto) {
    return this.ordersService.findAll(req.user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}
