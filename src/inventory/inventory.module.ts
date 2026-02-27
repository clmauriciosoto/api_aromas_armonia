import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory } from './entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryMovement } from '../sales/entities/inventory-movement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, Product, InventoryMovement])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
