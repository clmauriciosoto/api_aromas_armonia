import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleType } from './entities/sale-type.enum';
import { SaleStatus } from './entities/sale-status.enum';
import { GetSalesQueryDto } from './dto/get-sales-query.dto';
import { PaginatedSalesResponseDto } from './dto/paginated-sales-response.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { InventoryMovementType } from './entities/inventory-movement-type.enum';
import { RestockInventoryDto } from './dto/restock-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { SalesInventoryMovementResponseDto } from './dto/inventory-movement-response.dto';
import { PaginatedMovementsResponseDto } from './dto/paginated-movements-response.dto';
import { GetMovementsQueryDto } from './dto/get-movements-query.dto';
import { GetSalesSummaryQueryDto } from './dto/get-sales-summary-query.dto';
import { SalesSummaryResponseDto } from './dto/sales-summary-response.dto';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { OrderItemStatus } from '../orders/entities/order-item-status.enum';
import { ProductStatus } from '../products/entities/product-status.enum';

interface AuthenticatedUser {
  id?: string;
  sub?: string;
}

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async createSale(
    dto: CreateSaleDto,
    user: AuthenticatedUser,
  ): Promise<SaleResponseDto> {
    const actorId = this.resolveActorId(user);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const normalizedItems = this.normalizeItems(dto.items);
      const productIds = normalizedItems.map((item) => item.productId);

      const products = await manager.getRepository(Product).findBy({
        id: In(productIds),
      });
      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const productId of productIds) {
        const product = productMap.get(productId);
        if (!product) {
          throw new NotFoundException(`Product with id ${productId} not found`);
        }

        if (
          product.deletedAt !== null ||
          product.status === ProductStatus.ARCHIVED ||
          !product.isPurchasable
        ) {
          throw new BadRequestException(`Product ${productId} is not sellable`);
        }
      }

      const quantitiesByProduct = new Map<number, number>();
      for (const item of normalizedItems) {
        quantitiesByProduct.set(
          item.productId,
          (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      let linkedOrder: Order | null = null;
      if (dto.orderId !== undefined) {
        const linkedOrderId = Number(dto.orderId);
        if (!Number.isInteger(linkedOrderId) || linkedOrderId <= 0) {
          throw new BadRequestException('Invalid orderId');
        }

        linkedOrder = await manager.getRepository(Order).findOne({
          where: { id: linkedOrderId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!linkedOrder) {
          throw new NotFoundException(`Order ${linkedOrderId} not found`);
        }

        if (linkedOrder.status !== OrderStatus.PAID) {
          throw new ConflictException(
            `Order ${dto.orderId} has status ${linkedOrder.status} and cannot be converted`,
          );
        }

        const existingSale = await manager.getRepository(Sale).findOne({
          where: { orderId: linkedOrderId },
        });

        if (existingSale) {
          throw new ConflictException('Order already converted to sale');
        }
      }

      const inventoryStateByProduct = new Map<
        number,
        { previousQuantity: number; newQuantity: number }
      >();

      for (const [productId, quantity] of quantitiesByProduct.entries()) {
        const inventory = await this.lockInventoryByProductId(
          manager,
          productId,
        );
        if (!inventory) {
          throw new BadRequestException(
            `Insufficient stock for product ${productId}`,
          );
        }

        const available = inventory.quantity - inventory.reservedQuantity;
        if (available < quantity) {
          throw new BadRequestException(
            `Insufficient available stock for product ${productId}`,
          );
        }

        const previousQuantity = inventory.quantity;
        inventory.quantity -= quantity;
        await manager.getRepository(Inventory).save(inventory);
        inventoryStateByProduct.set(productId, {
          previousQuantity,
          newQuantity: inventory.quantity,
        });
      }

      let totalAmount = 0;
      const saleItems = normalizedItems.map((item) => {
        const product = productMap.get(item.productId)!;
        const defaultPrice = product.discountPrice ?? product.price;
        const unitPrice = item.unitPrice ?? defaultPrice;

        if (unitPrice === null || unitPrice === undefined || unitPrice < 0) {
          throw new BadRequestException(
            `Product ${item.productId} has invalid price for sale`,
          );
        }

        const subtotal = unitPrice * item.quantity;
        totalAmount += subtotal;

        return manager.getRepository(SaleItem).create({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      });

      const sale = manager.getRepository(Sale).create({
        type: linkedOrder ? SaleType.ORDER : SaleType.LOCAL,
        status: SaleStatus.COMPLETED,
        orderId: linkedOrder?.id ?? null,
        orderStatusBeforeSale: linkedOrder?.status ?? null,
        customerName:
          dto.customerName ??
          (linkedOrder
            ? `${linkedOrder.firstName} ${linkedOrder.lastName}`.trim()
            : null),
        customerEmail: dto.customerEmail ?? linkedOrder?.email ?? null,
        documentNumber: dto.documentNumber ?? null,
        totalAmount,
        createdBy: actorId,
        items: saleItems,
      });

      const savedSale = await manager.getRepository(Sale).save(sale);

      for (const [productId, quantity] of quantitiesByProduct.entries()) {
        const inventoryState = inventoryStateByProduct.get(productId)!;
        await manager.getRepository(InventoryMovement).save(
          manager.getRepository(InventoryMovement).create({
            productId,
            type: InventoryMovementType.SALE,
            quantityChange: -quantity,
            previousQuantity: inventoryState.previousQuantity,
            newQuantity: inventoryState.newQuantity,
            saleId: savedSale.id,
            createdBy: actorId,
            note: linkedOrder
              ? `Sale generated from order ${linkedOrder.id}`
              : 'Local sale',
          }),
        );
      }

      if (linkedOrder) {
        await manager.getRepository(Order).update(linkedOrder.id, {
          status: OrderStatus.SALE_CREATED,
        });
      }

      await queryRunner.commitTransaction();
      return this.toSaleResponse(savedSale);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof QueryFailedError) {
        const dbError = error as QueryFailedError & { code?: string };
        if (dbError.code === '23505' && dto.orderId !== undefined) {
          throw new ConflictException('Order already converted to sale');
        }
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createSaleFromOrder(
    orderId: number,
    user: AuthenticatedUser,
  ): Promise<SaleResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (!order.items?.length) {
      throw new BadRequestException('Order has no items');
    }

    const activeItems = order.items.filter(
      (item) => item.status === OrderItemStatus.ACTIVE,
    );

    if (!activeItems.length) {
      throw new BadRequestException('Order has no active items');
    }

    return this.createSale(
      {
        orderId,
        customerName: `${order.firstName} ${order.lastName}`.trim(),
        customerEmail: order.email,
        items: activeItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
      user,
    );
  }

  async cancelSale(
    id: string,
    user: AuthenticatedUser,
  ): Promise<SaleResponseDto> {
    const actorId = this.resolveActorId(user);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const sale = await manager
        .getRepository(Sale)
        .createQueryBuilder('sale')
        .leftJoinAndSelect('sale.items', 'items')
        .setLock('pessimistic_write')
        .where('sale.id = :id', { id })
        .getOne();

      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('Sale is already cancelled');
      }

      const quantitiesByProduct = new Map<number, number>();
      for (const item of sale.items) {
        quantitiesByProduct.set(
          item.productId,
          (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      for (const [productId, quantity] of quantitiesByProduct.entries()) {
        let inventory = await this.lockInventoryByProductId(manager, productId);

        if (!inventory) {
          inventory = manager.getRepository(Inventory).create({
            productId,
            quantity: 0,
            reservedQuantity: 0,
          });
        }

        const previousQuantity = inventory.quantity;
        inventory.quantity += quantity;
        const savedInventory = await manager
          .getRepository(Inventory)
          .save(inventory);

        await manager.getRepository(InventoryMovement).save(
          manager.getRepository(InventoryMovement).create({
            productId,
            type: InventoryMovementType.SALE_REVERSAL,
            quantityChange: quantity,
            previousQuantity,
            newQuantity: savedInventory.quantity,
            saleId: sale.id,
            createdBy: actorId,
            note: 'Sale cancellation reversal',
          }),
        );
      }

      sale.status = SaleStatus.CANCELLED;
      const savedSale = await manager.getRepository(Sale).save(sale);

      if (sale.type === SaleType.ORDER && sale.orderId) {
        const order = await manager.getRepository(Order).findOne({
          where: { id: sale.orderId },
          lock: { mode: 'pessimistic_write' },
        });

        if (order) {
          order.status = sale.orderStatusBeforeSale ?? OrderStatus.PAID;
          await manager.getRepository(Order).save(order);
        }
      }

      await queryRunner.commitTransaction();
      return this.toSaleResponse(savedSale);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async restockInventory(
    dto: RestockInventoryDto,
    user: AuthenticatedUser,
  ): Promise<SalesInventoryMovementResponseDto> {
    const actorId = this.resolveActorId(user);

    return this.dataSource.transaction(async (manager) => {
      const product = await manager.getRepository(Product).findOne({
        where: { id: dto.productId },
      });

      if (!product || product.deletedAt !== null) {
        throw new NotFoundException(
          `Product with id ${dto.productId} not found`,
        );
      }

      let inventory = await this.lockInventoryByProductId(
        manager,
        dto.productId,
      );
      if (!inventory) {
        inventory = manager.getRepository(Inventory).create({
          productId: dto.productId,
          quantity: 0,
          reservedQuantity: 0,
        });
      }

      const previousQuantity = inventory.quantity;
      inventory.quantity += dto.quantity;
      const savedInventory = await manager
        .getRepository(Inventory)
        .save(inventory);

      const movement = await manager.getRepository(InventoryMovement).save(
        manager.getRepository(InventoryMovement).create({
          productId: dto.productId,
          type: InventoryMovementType.RESTOCK,
          quantityChange: dto.quantity,
          previousQuantity,
          newQuantity: savedInventory.quantity,
          saleId: null,
          note: dto.note ?? null,
          createdBy: actorId,
        }),
      );

      return this.toMovementResponse(movement, product.name);
    });
  }

  async adjustInventory(
    dto: AdjustInventoryDto,
    user: AuthenticatedUser,
  ): Promise<SalesInventoryMovementResponseDto> {
    const actorId = this.resolveActorId(user);

    if (dto.quantityChange === 0) {
      throw new BadRequestException('quantityChange cannot be 0');
    }

    return this.dataSource.transaction(async (manager) => {
      const product = await manager.getRepository(Product).findOne({
        where: { id: dto.productId },
      });

      if (!product || product.deletedAt !== null) {
        throw new NotFoundException(
          `Product with id ${dto.productId} not found`,
        );
      }

      let inventory = await this.lockInventoryByProductId(
        manager,
        dto.productId,
      );
      if (!inventory) {
        if (dto.quantityChange < 0) {
          throw new BadRequestException('Cannot reduce stock below zero');
        }

        inventory = manager.getRepository(Inventory).create({
          productId: dto.productId,
          quantity: 0,
          reservedQuantity: 0,
        });
      }

      const previousQuantity = inventory.quantity;
      const nextQuantity = previousQuantity + dto.quantityChange;

      if (nextQuantity < 0) {
        throw new BadRequestException('Cannot reduce stock below zero');
      }

      if (nextQuantity < inventory.reservedQuantity) {
        throw new BadRequestException(
          'Cannot reduce stock below reserved quantity',
        );
      }

      inventory.quantity = nextQuantity;
      const savedInventory = await manager
        .getRepository(Inventory)
        .save(inventory);

      const movement = await manager.getRepository(InventoryMovement).save(
        manager.getRepository(InventoryMovement).create({
          productId: dto.productId,
          type: InventoryMovementType.ADJUSTMENT,
          quantityChange: dto.quantityChange,
          previousQuantity,
          newQuantity: savedInventory.quantity,
          saleId: null,
          note: dto.note ?? null,
          createdBy: actorId,
        }),
      );

      return this.toMovementResponse(movement, product.name);
    });
  }

  async findSales(query: GetSalesQueryDto): Promise<PaginatedSalesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items');

    if (query.status) {
      qb.andWhere('sale.status = :status', { status: query.status });
    }

    if (query.type) {
      qb.andWhere('sale.type = :type', { type: query.type });
    }

    if (query.startDate) {
      qb.andWhere('sale.createdAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('sale.createdAt <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('sale.createdAt', 'DESC').skip(skip).take(limit);

    const [sales, total] = await qb.getManyAndCount();

    return {
      data: sales.map((sale) => this.toSaleResponse(sale)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findSaleById(id: string): Promise<SaleResponseDto> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return this.toSaleResponse(sale);
  }

  async updateDocumentNumber(
    id: string,
    documentNumber: number | null,
  ): Promise<SaleResponseDto> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    sale.documentNumber = documentNumber;
    const saved = await this.saleRepository.save(sale);
    return this.toSaleResponse(saved);
  }

  async findMovements(
    query: GetMovementsQueryDto,
  ): Promise<PaginatedMovementsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product');

    if (query.productId) {
      qb.andWhere('movement.productId = :productId', {
        productId: query.productId,
      });
    }

    if (query.type) {
      qb.andWhere('movement.type = :type', { type: query.type });
    }

    if (query.saleId) {
      qb.andWhere('movement.saleId = :saleId', { saleId: query.saleId });
    }

    if (query.startDate) {
      qb.andWhere('movement.createdAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('movement.createdAt <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('movement.createdAt', 'DESC').skip(skip).take(limit);

    const [movements, total] = await qb.getManyAndCount();

    return {
      data: movements.map((movement) =>
        this.toMovementResponse(movement, movement.product?.name ?? ''),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSalesSummary(
    query: GetSalesSummaryQueryDto,
  ): Promise<SalesSummaryResponseDto> {
    const summaryQb = this.saleRepository.createQueryBuilder('sale');

    if (query.startDate) {
      summaryQb.andWhere('sale.createdAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      summaryQb.andWhere('sale.createdAt <= :endDate', {
        endDate: query.endDate,
      });
    }

    const completedAggregation = await summaryQb
      .clone()
      .leftJoin('sale.items', 'item')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'totalSalesAmount')
      .addSelect('COUNT(DISTINCT sale.id)', 'totalSalesCount')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'totalItemsSold')
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne<{
        totalSalesAmount: string;
        totalSalesCount: string;
        totalItemsSold: string;
      }>();

    const cancelledAggregation = await summaryQb
      .clone()
      .select('COUNT(sale.id)', 'cancelledSalesCount')
      .andWhere('sale.status = :status', { status: SaleStatus.CANCELLED })
      .getRawOne<{ cancelledSalesCount: string }>();

    return {
      totalSalesAmount: Number(completedAggregation?.totalSalesAmount ?? 0),
      totalSalesCount: Number(completedAggregation?.totalSalesCount ?? 0),
      totalItemsSold: Number(completedAggregation?.totalItemsSold ?? 0),
      cancelledSalesCount: Number(
        cancelledAggregation?.cancelledSalesCount ?? 0,
      ),
    };
  }

  private async lockInventoryByProductId(
    manager: EntityManager,
    productId: number,
  ): Promise<Inventory | null> {
    return manager
      .getRepository(Inventory)
      .createQueryBuilder('inventory')
      .setLock('pessimistic_write')
      .where('inventory.productId = :productId', { productId })
      .getOne();
  }

  private normalizeItems(
    items: CreateSaleDto['items'],
  ): Array<{ productId: number; quantity: number; unitPrice?: number }> {
    const normalized = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    for (const item of normalized) {
      if (!Number.isInteger(item.productId) || item.productId <= 0) {
        throw new BadRequestException('Invalid productId in sale items');
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException('Invalid quantity in sale items');
      }

      if (
        item.unitPrice !== undefined &&
        (!Number.isInteger(item.unitPrice) || item.unitPrice < 0)
      ) {
        throw new BadRequestException('Invalid unitPrice in sale items');
      }
    }

    return normalized;
  }

  private resolveActorId(user: AuthenticatedUser): string {
    const actorId = user.id ?? user.sub;
    if (!actorId) {
      throw new BadRequestException('Authenticated user id not found');
    }

    return actorId;
  }

  private toSaleResponse(sale: Sale): SaleResponseDto {
    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      documentNumber: sale.documentNumber,
      type: sale.type,
      status: sale.status,
      orderId: sale.orderId,
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      totalAmount: sale.totalAmount,
      createdBy: sale.createdBy,
      createdAt: sale.createdAt,
      items: (sale.items ?? []).map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    };
  }

  private toMovementResponse(
    movement: InventoryMovement,
    productName: string,
  ): SalesInventoryMovementResponseDto {
    return {
      id: movement.id,
      productId: movement.productId,
      productName,
      type: movement.type,
      quantityChange: movement.quantityChange,
      previousQuantity: movement.previousQuantity,
      newQuantity: movement.newQuantity,
      saleId: movement.saleId,
      note: movement.note,
      createdBy: movement.createdBy,
      createdAt: movement.createdAt,
    };
  }
}
