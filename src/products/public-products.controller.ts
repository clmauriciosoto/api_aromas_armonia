import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { GetPublicProductsQueryDto } from './dto/get-public-products-query.dto';
import { ProductRelationGroupsResponseDto } from './dto/product-relations-response.dto';

@ApiTags('public-products')
@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: GetPublicProductsQueryDto) {
    return this.productsService.findPublic(query);
  }

  @ApiOperation({
    summary: 'Get public product detail with related products',
    description:
      'Returns the public product detail and includes grouped related products filtered to active and purchasable items.',
  })
  @ApiParam({ name: 'slug', type: String, example: 'aromatizante-lavanda' })
  @ApiOkResponse({
    description:
      'Product detail includes relatedProducts with accessories, recommended, alsoInteresting and refills.',
    schema: {
      example: {
        id: 42,
        name: 'Aromatizante Lavanda',
        slug: 'aromatizante-lavanda',
        shortDescription: 'Aromatizante textil para hogar',
        description: 'Aroma floral suave para ropa y ambientes',
        price: 7990,
        discountPrice: null,
        isPurchasable: true,
        relatedProducts: {
          accessories: [
            {
              relationId: 3,
              relationType: 'ACCESSORY',
              displayOrder: 0,
              isActive: true,
              product: {
                id: 12,
                name: 'Gatillo premium',
                slug: 'gatillo-premium',
                shortDescription: 'Accesorio para aromatizantes',
                price: 2990,
                discountPrice: null,
                isPurchasable: true,
                status: 'ACTIVE',
                image: 'https://cdn.aromasarmonia.cl/products/gatillo-premium.jpg',
              },
            },
          ],
          recommended: [],
          alsoInteresting: [],
          refills: [],
        },
      },
    },
  })
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }
}
