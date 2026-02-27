import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { GetInventoryQueryDto } from './dto/get-inventory-query.dto';
import { PaginatedInventoryResponseDto } from './dto/paginated-inventory-response.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { ProductStatus } from '../products/entities/product-status.enum';
import { InventoryMovement } from '../sales/entities/inventory-movement.entity';
import { InventoryMovementType } from '../sales/entities/inventory-movement-type.enum';

const MAX_DB_INT = 2147483647;

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private readonly inventoryMovementRepository: Repository<InventoryMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    query: GetInventoryQueryDto,
  ): Promise<PaginatedInventoryResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const baseQb = this.productRepository
      .createQueryBuilder('product')
      .leftJoin(Inventory, 'inventory', 'inventory.productId = product.id')
      .where('product.deletedAt IS NULL')
      .andWhere('product.status != :archived', {
        archived: ProductStatus.ARCHIVED,
      });

    if (query.productName) {
      baseQb.andWhere('product.name ILIKE :productName', {
        productName: `%${query.productName}%`,
      });
    }

    if (query.lowStock) {
      baseQb.andWhere('COALESCE(inventory.quantity, 0) <= :threshold', {
        threshold: query.lowStockThreshold ?? 10,
      });
    }

    switch (query.sortBy) {
      case 'quantity':
        baseQb.orderBy(
          'COALESCE(inventory.quantity, 0)',
          query.sortOrder ?? 'DESC',
        );
        break;
      case 'createdAt':
        baseQb.orderBy(
          'inventory.createdAt',
          query.sortOrder ?? 'DESC',
          'NULLS LAST',
        );
        break;
      case 'productName':
        baseQb.orderBy('product.name', query.sortOrder ?? 'ASC');
        break;
      default:
        baseQb.orderBy(
          'inventory.updatedAt',
          query.sortOrder ?? 'DESC',
          'NULLS LAST',
        );
    }

    const total = await baseQb.getCount();

    const rows = await baseQb
      .clone()
      .select([
        'product.id AS "productId"',
        'product.name AS "productName"',
        'inventory.id AS "id"',
        'COALESCE(inventory.quantity, 0) AS "quantity"',
        'inventory.createdAt AS "createdAt"',
        'inventory.updatedAt AS "updatedAt"',
      ])
      .skip(skip)
      .take(limit)
      .getRawMany<{
        id: string | null;
        productId: number;
        productName: string;
        quantity: string | number;
        createdAt: Date | null;
        updatedAt: Date | null;
      }>();

    return {
      data: rows.map((row) => ({
        id: row.id,
        productId: Number(row.productId),
        productName: row.productName,
        quantity: Number(row.quantity),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProductId(productId: number): Promise<InventoryResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (
      !product ||
      product.deletedAt !== null ||
      product.status === ProductStatus.ARCHIVED
    ) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const record = await this.inventoryRepository.findOne({
      where: { productId },
    });

    if (!record) {
      return {
        id: null,
        productId: product.id,
        productName: product.name,
        quantity: 0,
        createdAt: null,
        updatedAt: null,
      };
    }

    return {
      id: record.id,
      productId: product.id,
      productName: product.name,
      quantity: record.quantity,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async adjustStock(
    productId: number,
    adjustment: number,
    actorId: string,
  ): Promise<InventoryResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.getRepository(Product).findOne({
        where: { id: productId },
      });

      if (
        !product ||
        product.deletedAt !== null ||
        product.status === ProductStatus.ARCHIVED
      ) {
        throw new NotFoundException(`Product with id ${productId} not found`);
      }

      const inventoryRepo = manager.getRepository(Inventory);
      let inventory = await inventoryRepo
        .createQueryBuilder('inventory')
        .setLock('pessimistic_write')
        .where('inventory.productId = :productId', { productId })
        .getOne();

      if (!inventory) {
        if (adjustment < 0) {
          throw new BadRequestException('Cannot reduce stock below zero');
        }

        inventory = inventoryRepo.create({
          productId,
          quantity: 0,
          reservedQuantity: 0,
        });
      }

      const nextQuantity = inventory.quantity + adjustment;
      this.validateQuantity(nextQuantity);

      if (nextQuantity < inventory.reservedQuantity) {
        throw new BadRequestException(
          'Cannot reduce stock below reserved quantity',
        );
      }

      const previousQuantity = inventory.quantity;
      inventory.quantity = nextQuantity;
      const saved = await inventoryRepo.save(inventory);

      const movementRepo = manager.getRepository(InventoryMovement);
      await movementRepo.save(
        movementRepo.create({
          productId,
          type: InventoryMovementType.ADJUSTMENT,
          quantityChange: adjustment,
          previousQuantity,
          newQuantity: saved.quantity,
          saleId: null,
          note: 'Inventory adjusted from /inventory/:productId/adjust',
          createdBy: actorId,
        }),
      );

      return {
        id: saved.id,
        productId,
        productName: product.name,
        quantity: saved.quantity,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    });
  }

  async decreaseStock(
    productId: number,
    quantity: number,
    manager?: EntityManager,
  ): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive integer');
    }

    const operation = async (txManager: EntityManager): Promise<void> => {
      const inventory = await txManager
        .getRepository(Inventory)
        .createQueryBuilder('inventory')
        .setLock('pessimistic_write')
        .where('inventory.productId = :productId', { productId })
        .getOne();

      if (!inventory) {
        throw new BadRequestException(
          `Insufficient stock for product ${productId}`,
        );
      }

      const nextQuantity = inventory.quantity - quantity;
      if (nextQuantity < 0) {
        throw new BadRequestException(
          `Insufficient stock for product ${productId}`,
        );
      }

      inventory.quantity = nextQuantity;
      await txManager.getRepository(Inventory).save(inventory);
    };

    if (manager) {
      await operation(manager);
      return;
    }

    await this.dataSource.transaction(operation);
  }

  async increaseStock(
    productId: number,
    quantity: number,
    manager?: EntityManager,
  ): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive integer');
    }

    const operation = async (txManager: EntityManager): Promise<void> => {
      const inventoryRepo = txManager.getRepository(Inventory);
      let inventory = await inventoryRepo
        .createQueryBuilder('inventory')
        .setLock('pessimistic_write')
        .where('inventory.productId = :productId', { productId })
        .getOne();

      if (!inventory) {
        const product = await txManager.getRepository(Product).findOne({
          where: { id: productId },
        });

        if (
          !product ||
          product.deletedAt !== null ||
          product.status === ProductStatus.ARCHIVED
        ) {
          throw new NotFoundException(`Product with id ${productId} not found`);
        }

        inventory = inventoryRepo.create({
          productId,
          quantity: 0,
          reservedQuantity: 0,
        });
      }

      const nextQuantity = inventory.quantity + quantity;
      this.validateQuantity(nextQuantity);

      inventory.quantity = nextQuantity;
      await inventoryRepo.save(inventory);
    };

    if (manager) {
      await operation(manager);
      return;
    }

    await this.dataSource.transaction(operation);
  }

  private validateQuantity(nextQuantity: number): void {
    if (nextQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    if (nextQuantity > MAX_DB_INT) {
      throw new BadRequestException('Stock quantity exceeds allowed limit');
    }
  }
}
