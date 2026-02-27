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

const MAX_DB_INT = 2147483647;

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    query: GetInventoryQueryDto,
  ): Promise<PaginatedInventoryResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product');

    if (query.productName) {
      qb.andWhere('product.name ILIKE :productName', {
        productName: `%${query.productName}%`,
      });
    }

    if (query.lowStock) {
      qb.andWhere('inventory.quantity <= :threshold', {
        threshold: query.lowStockThreshold ?? 10,
      });
    }

    switch (query.sortBy) {
      case 'quantity':
        qb.orderBy('inventory.quantity', query.sortOrder ?? 'DESC');
        break;
      case 'createdAt':
        qb.orderBy('inventory.createdAt', query.sortOrder ?? 'DESC');
        break;
      case 'productName':
        qb.orderBy('product.name', query.sortOrder ?? 'DESC');
        break;
      default:
        qb.orderBy('inventory.updatedAt', query.sortOrder ?? 'DESC');
    }

    qb.skip(skip).take(limit);

    const [records, total] = await qb.getManyAndCount();

    return {
      data: records.map((record) => this.toResponseDto(record)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProductId(productId: number): Promise<InventoryResponseDto> {
    const record = await this.inventoryRepository.findOne({
      where: { productId },
      relations: ['product'],
    });

    if (!record) {
      throw new NotFoundException(
        `Inventory for product ${productId} not found`,
      );
    }

    return this.toResponseDto(record);
  }

  async adjustStock(
    productId: number,
    adjustment: number,
  ): Promise<InventoryResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.getRepository(Product).findOne({
        where: { id: productId },
      });

      if (!product) {
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

      inventory.quantity = nextQuantity;
      const saved = await inventoryRepo.save(inventory);

      return this.toResponseDto({
        ...saved,
        product,
      });
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
        if (!product) {
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

  private toResponseDto(inventory: Inventory): InventoryResponseDto {
    return {
      id: inventory.id,
      productId: inventory.productId,
      productName: inventory.product?.name ?? '',
      quantity: inventory.quantity,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
    };
  }
}
