import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { GetInventoryQueryDto } from './dto/get-inventory-query.dto';
import { PaginatedInventoryResponseDto } from './dto/paginated-inventory-response.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { ProductStatus } from '../products/entities/product-status.enum';
import { InventoryMovement } from '../sales/entities/inventory-movement.entity';
import { InventoryMovementType } from '../sales/entities/inventory-movement-type.enum';
import {
  CreateInventoryMovementDto,
  CreateInventoryMovementProductDto,
} from './dto/create-inventory-movement.dto';
import {
  InventoryMovementItemResponseDto,
  InventoryMovementResponseDto,
} from './dto/inventory-movement-response.dto';
import { InventoryBatchMovementType } from './entities/inventory-batch-movement-type.enum';
import { InventoryBatchMovement } from './entities/inventory-batch-movement.entity';
import { InventoryBatchMovementItem } from './entities/inventory-batch-movement-item.entity';
import { GetInventoryMovementsQueryDto } from './dto/get-inventory-movements-query.dto';
import { PaginatedInventoryMovementsResponseDto } from './dto/paginated-inventory-movements-response.dto';

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
    @InjectRepository(InventoryBatchMovement)
    private readonly inventoryBatchMovementRepository: Repository<InventoryBatchMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async createMovement(
    dto: CreateInventoryMovementDto,
    actorId: string,
  ): Promise<InventoryMovementResponseDto> {
    if (dto.type !== InventoryBatchMovementType.IN) {
      throw new BadRequestException(
        'Only IN movements are supported in this endpoint for now',
      );
    }

    const normalizedProducts = this.aggregateMovementProducts(dto.products);
    const productIds = normalizedProducts.map((item) => item.productId);

    return this.dataSource.transaction(async (manager) => {
      const products = await manager.getRepository(Product).findBy({
        id: In(productIds),
      });
      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const item of normalizedProducts) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Product with id ${item.productId} not found`,
          );
        }

        if (
          product.deletedAt !== null ||
          product.status === ProductStatus.ARCHIVED
        ) {
          throw new BadRequestException(
            `Product with id ${item.productId} is not available`,
          );
        }
      }

      const movement = await manager.getRepository(InventoryBatchMovement).save(
        manager.getRepository(InventoryBatchMovement).create({
          type: dto.type,
          createdBy: actorId,
        }),
      );

      const movementItems: InventoryBatchMovementItem[] = [];
      const responseItems: InventoryMovementItemResponseDto[] = [];

      for (const item of normalizedProducts) {
        const inventoryRepo = manager.getRepository(Inventory);
        let inventory = await inventoryRepo
          .createQueryBuilder('inventory')
          .setLock('pessimistic_write')
          .where('inventory.productId = :productId', {
            productId: item.productId,
          })
          .getOne();

        if (!inventory) {
          inventory = inventoryRepo.create({
            productId: item.productId,
            quantity: 0,
            reservedQuantity: 0,
          });
        }

        const previousQuantity = inventory.quantity;
        const nextQuantity = previousQuantity + item.quantity;
        this.validateQuantity(nextQuantity);

        inventory.quantity = nextQuantity;
        const savedInventory = await inventoryRepo.save(inventory);

        const productName = productMap.get(item.productId)?.name ?? '';

        movementItems.push(
          manager.getRepository(InventoryBatchMovementItem).create({
            movementId: movement.id,
            productId: item.productId,
            quantity: item.quantity,
          }),
        );

        await manager.getRepository(InventoryMovement).save(
          manager.getRepository(InventoryMovement).create({
            productId: item.productId,
            type: InventoryMovementType.RESTOCK,
            quantityChange: item.quantity,
            previousQuantity,
            newQuantity: savedInventory.quantity,
            saleId: null,
            note: `Batch movement ${movement.id}`,
            createdBy: actorId,
          }),
        );

        responseItems.push({
          id: '',
          productId: item.productId,
          productName,
          quantity: item.quantity,
          previousQuantity,
          newQuantity: savedInventory.quantity,
        });
      }

      const savedItems = await manager
        .getRepository(InventoryBatchMovementItem)
        .save(movementItems);

      const itemsByProductId = new Map(
        savedItems.map((savedItem) => [savedItem.productId, savedItem.id]),
      );

      for (const responseItem of responseItems) {
        responseItem.id = itemsByProductId.get(responseItem.productId) ?? '';
      }

      return {
        id: movement.id,
        type: movement.type,
        createdBy: movement.createdBy,
        createdAt: movement.createdAt,
        items: responseItems,
      };
    });
  }

  async findMovements(
    query: GetInventoryMovementsQueryDto,
  ): Promise<PaginatedInventoryMovementsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.inventoryBatchMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('movement.createdAt', 'DESC')
      .skip(skip)
      .take(limit);
    const { type, createdBy, startDate, endDate } = query;

    if (type) {
      qb.andWhere('movement.type = :type', { type });
    }

    if (typeof createdBy === 'string') {
      qb.andWhere('movement.createdBy = :createdBy', {
        createdBy,
      });
    }

    if (typeof startDate === 'string') {
      qb.andWhere('movement.createdAt >= :startDate', {
        startDate,
      });
    }

    if (typeof endDate === 'string') {
      qb.andWhere('movement.createdAt <= :endDate', {
        endDate,
      });
    }

    if (typeof startDate === 'string' && typeof endDate === 'string') {
      const startDateValue = new Date(startDate);
      const endDateValue = new Date(endDate);
      if (startDateValue > endDateValue) {
        throw new BadRequestException(
          'startDate cannot be greater than endDate',
        );
      }
    }

    const [movements, total] = await qb.getManyAndCount();

    return {
      data: movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        createdBy: movement.createdBy,
        createdAt: movement.createdAt,
        items: movement.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name ?? '',
          quantity: item.quantity,
        })),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

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

  private aggregateMovementProducts(
    products: CreateInventoryMovementProductDto[],
  ): CreateInventoryMovementProductDto[] {
    const quantitiesByProduct = new Map<number, number>();

    for (const product of products) {
      quantitiesByProduct.set(
        product.productId,
        (quantitiesByProduct.get(product.productId) ?? 0) + product.quantity,
      );
    }

    return Array.from(quantitiesByProduct.entries()).map(
      ([productId, quantity]) => ({
        productId,
        quantity,
      }),
    );
  }
}
