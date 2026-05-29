import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../users/entities/admin.entity';
import { GetAdminProductsQueryDto } from './dto/get-admin-products-query.dto';
import { Product } from './entities/product.entity';
import {
  PaginatedProductsResponse,
  ProductAdminResponse,
} from './products.service';
import { UpdateProductRelationsDto } from './dto/update-product-relations.dto';
import { ProductRelationGroupsResponseDto } from './dto/product-relations-response.dto';

@ApiTags('admin-products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN)
@ApiBearerAuth('bearer')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query() query: GetAdminProductsQueryDto,
  ): Promise<PaginatedProductsResponse> {
    return this.productsService.findAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.findOneAdmin(id);
  }

  @ApiOperation({
    summary: 'Get product relations grouped by type',
    description:
      'Returns the configured related products for admin editing, grouped as accessories, recommended, alsoInteresting and refills.',
  })
  @ApiParam({ name: 'id', type: Number, example: 42 })
  @ApiOkResponse({ type: ProductRelationGroupsResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get(':id/relations')
  getRelations(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getAdminProductRelations(id);
  }

  @Get('barcode/:barcode')
  findOneByBarcode(@Param('barcode') barcode: string): Promise<Product> {
    return this.productsService.findOneAdminByBarcode(barcode);
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductAdminResponse> {
    return this.productsService.update(id, updateProductDto);
  }

  @ApiOperation({
    summary: 'Replace product relations',
    description:
      'Replaces all configured relationships for the product. Each group is directional and fully admin-managed.',
  })
  @ApiParam({ name: 'id', type: Number, example: 42 })
  @ApiBody({
    type: UpdateProductRelationsDto,
    examples: {
      default: {
        value: {
          accessories: [
            { targetProductId: 12, displayOrder: 0, isActive: true },
          ],
          recommended: [
            { targetProductId: 18, displayOrder: 0, isActive: true },
          ],
          alsoInteresting: [
            { targetProductId: 25, displayOrder: 0, isActive: true },
          ],
          refills: [{ targetProductId: 30, displayOrder: 0, isActive: true }],
        },
      },
    },
  })
  @ApiOkResponse({ type: ProductRelationGroupsResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid relation payload' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Put(':id/relations')
  replaceRelations(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateProductRelationsDto,
  ) {
    return this.productsService.replaceAdminProductRelations(id, payload);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.archive(id);
  }
}
