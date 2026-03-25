import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../users/entities/admin.entity';
import { GetInventoryQueryDto } from './dto/get-inventory-query.dto';
import { PaginatedInventoryResponseDto } from './dto/paginated-inventory-response.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { InventoryMovementResponseDto } from './dto/inventory-movement-response.dto';
import { GetInventoryMovementsQueryDto } from './dto/get-inventory-movements-query.dto';
import { PaginatedInventoryMovementsResponseDto } from './dto/paginated-inventory-movements-response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id?: string;
    sub?: string;
    role: string;
  };
}

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN)
@ApiBearerAuth('bearer')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: 'List inventory for all products',
    description:
      'Admin-only endpoint returning all active products with LEFT JOIN inventory. Products without inventory are returned with quantity=0.',
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
    name: 'productName',
    required: false,
    type: String,
    description: 'Case-insensitive partial product name filter',
  })
  @ApiQuery({
    name: 'lowStock',
    required: false,
    type: Boolean,
    description: 'When true, returns only low stock records',
  })
  @ApiQuery({
    name: 'lowStockThreshold',
    required: false,
    type: Number,
    description: 'Used when lowStock=true. Default is 10',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['quantity', 'createdAt', 'updatedAt', 'productName'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiOkResponse({
    description: 'Inventory records retrieved successfully',
    type: PaginatedInventoryResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - admin role required' })
  findAll(
    @Query() query: GetInventoryQueryDto,
  ): Promise<PaginatedInventoryResponseDto> {
    return this.inventoryService.findAll(query);
  }

  @Get('movements')
  @ApiOperation({
    summary: 'List grouped inventory movements',
    description:
      'Returns paginated grouped movements with movement items and product references.',
  })
  @ApiOkResponse({
    description: 'Inventory movements retrieved successfully',
    type: PaginatedInventoryMovementsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - admin role required' })
  findMovements(
    @Query() query: GetInventoryMovementsQueryDto,
  ): Promise<PaginatedInventoryMovementsResponseDto> {
    return this.inventoryService.findMovements(query);
  }

  @Get(':productId')
  @ApiOperation({
    summary: 'Get inventory by product ID',
    description:
      'Returns quantity=0 when product exists but no inventory row has been created yet.',
  })
  @ApiParam({ name: 'productId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Inventory detail retrieved successfully',
    type: InventoryResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - admin role required' })
  @ApiNotFoundResponse({ description: 'Product inventory not found' })
  findByProductId(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.findByProductId(productId);
  }

  @Patch(':productId/adjust')
  @ApiOperation({ summary: 'Adjust stock by product ID' })
  @ApiParam({ name: 'productId', type: Number, example: 1 })
  @ApiBody({ type: AdjustStockDto })
  @ApiOkResponse({
    description: 'Stock adjusted successfully',
    type: InventoryResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - admin role required' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiBadRequestResponse({
    description: 'Invalid adjustment operation or resulting negative stock',
  })
  adjustStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: AdjustStockDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<InventoryResponseDto> {
    const actorId = req.user?.id ?? req.user?.sub;
    if (!actorId) {
      throw new UnauthorizedException('Authenticated user id not found');
    }

    return this.inventoryService.adjustStock(productId, dto.adjustment, actorId);
  }

  @Post('movements')
  @ApiOperation({
    summary: 'Register inventory movement with multiple products',
    description:
      'Creates a grouped inventory movement and updates stock atomically for each included product.',
  })
  @ApiBody({ type: CreateInventoryMovementDto })
  @ApiOkResponse({
    description: 'Inventory movement created successfully',
    type: InventoryMovementResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - admin role required' })
  @ApiBadRequestResponse({ description: 'Invalid movement payload' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  createMovement(
    @Body() dto: CreateInventoryMovementDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<InventoryMovementResponseDto> {
    const actorId = req.user?.id ?? req.user?.sub;
    if (!actorId) {
      throw new UnauthorizedException('Authenticated user id not found');
    }

    return this.inventoryService.createMovement(dto, actorId);
  }

}
