import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory } from './entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryMovement } from '../sales/entities/inventory-movement.entity';
import { InventoryBatchMovement } from './entities/inventory-batch-movement.entity';
import { InventoryBatchMovementItem } from './entities/inventory-batch-movement-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      Product,
      InventoryMovement,
      InventoryBatchMovement,
      InventoryBatchMovementItem,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
