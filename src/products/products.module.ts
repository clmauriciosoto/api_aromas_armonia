import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { PublicProductsController } from './public-products.controller';
import { AdminProductsController } from './admin-products.controller';
import { ProductImage } from './entities/product-image.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      Attribute,
      OrderItem,
      Inventory,
    ]),
  ],
  controllers: [
    ProductsController,
    PublicProductsController,
    AdminProductsController,
  ],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
