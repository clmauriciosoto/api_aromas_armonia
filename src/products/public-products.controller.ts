import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetPublicProductsQueryDto } from './dto/get-public-products-query.dto';

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: GetPublicProductsQueryDto) {
    return this.productsService.findPublic(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }
}
