import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DashboardAlertsQueryDto } from './dto/dashboard-alerts-query.dto';
import { DashboardAlertsResponseDto } from './dto/dashboard-alerts-response.dto';
import { DashboardInventoryOverviewResponseDto } from './dto/dashboard-inventory-overview-response.dto';
import { DashboardOrdersOverviewResponseDto } from './dto/dashboard-orders-overview-response.dto';
import { DashboardProductsOverviewResponseDto } from './dto/dashboard-products-overview-response.dto';
import { DashboardRangeQueryDto } from './dto/dashboard-range-query.dto';
import { DashboardSalesOverviewResponseDto } from './dto/dashboard-sales-overview-response.dto';
import { DashboardSalesTimeseriesResponseDto } from './dto/dashboard-sales-timeseries-response.dto';
import { DashboardTimeseriesQueryDto, DashboardGranularity } from './dto/dashboard-timeseries-query.dto';
import { DashboardTopProductsQueryDto } from './dto/dashboard-top-products-query.dto';
import { DashboardTopProductsResponseDto } from './dto/dashboard-top-products-response.dto';
import { DashboardOrdersFunnelResponseDto } from './dto/dashboard-orders-funnel-response.dto';
import { DashboardLowStockQueryDto } from './dto/dashboard-low-stock-query.dto';
import { DashboardLowStockResponseDto } from './dto/dashboard-low-stock-response.dto';
import { DashboardActionableOrdersResponseDto } from './dto/dashboard-actionable-orders-response.dto';
import { DashboardActionableOrdersQueryDto } from './dto/dashboard-actionable-orders-query.dto';
import { DashboardWaitingStockOrdersQueryDto } from './dto/dashboard-waiting-stock-orders-query.dto';
import { DashboardWaitingStockOrdersResponseDto } from './dto/dashboard-waiting-stock-orders-response.dto';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { Product } from '../products/entities/product.entity';
import { ProductStatus } from '../products/entities/product-status.enum';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { SaleStatus } from '../sales/entities/sale-status.enum';
import { OrderItem } from '../orders/entities/order-item.entity';

type DateRange = {
  startDate: Date;
  endDate: Date;
};

type NumericComparison = {
  current: number;
  previous: number;
  delta: number | null;
  deltaPercent: number | null;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async getSalesOverview(
    query: DashboardRangeQueryDto,
  ): Promise<DashboardSalesOverviewResponseDto> {
    const range = this.resolveRange(query);
    const previousRange = this.resolvePreviousRange(range);

    const [completedAggregation, previousCompletedAggregation, cancelledAggregation] =
      await Promise.all([
        this.getCompletedSalesAggregation(range),
        this.getCompletedSalesAggregation(previousRange),
        this.getCancelledSalesAggregation(range),
      ]);

    const totalSalesAmount = Number(completedAggregation?.totalSalesAmount ?? 0);
    const totalSalesCount = Number(completedAggregation?.totalSalesCount ?? 0);
    const previousSalesAmount = Number(
      previousCompletedAggregation?.totalSalesAmount ?? 0,
    );
    const previousSalesCount = Number(
      previousCompletedAggregation?.totalSalesCount ?? 0,
    );
    const previousItemsSold = Number(
      previousCompletedAggregation?.totalItemsSold ?? 0,
    );

    return {
      range: this.serializeRange(range),
      previousRange: this.serializeRange(previousRange),
      generatedAt: new Date().toISOString(),
      totalSalesAmount,
      totalSalesCount,
      totalItemsSold: Number(completedAggregation?.totalItemsSold ?? 0),
      cancelledSalesCount: Number(
        cancelledAggregation?.cancelledSalesCount ?? 0,
      ),
      averageTicket: totalSalesCount > 0 ? Math.round(totalSalesAmount / totalSalesCount) : 0,
      salesAmountComparison: this.buildComparison(
        totalSalesAmount,
        previousSalesAmount,
      ),
      salesCountComparison: this.buildComparison(
        totalSalesCount,
        previousSalesCount,
      ),
      itemsSoldComparison: this.buildComparison(
        Number(completedAggregation?.totalItemsSold ?? 0),
        previousItemsSold,
      ),
    };
  }

  async getOrdersOverview(
    query: DashboardRangeQueryDto,
  ): Promise<DashboardOrdersOverviewResponseDto> {
    const range = this.resolveRange(query);
    const previousRange = this.resolvePreviousRange(range);

    const [rows, previousRows] = await Promise.all([
      this.getOrderStatusCounts(range),
      this.getOrderStatusCounts(previousRange),
    ]);

    const counts = new Map<OrderStatus, number>(
      rows.map((row) => [row.status, Number(row.count)]),
    );
    const previousCounts = new Map<OrderStatus, number>(
      previousRows.map((row) => [row.status, Number(row.count)]),
    );

    const statuses = Object.values(OrderStatus).map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));

    const totalOrders = statuses.reduce((sum, item) => sum + item.count, 0);
    const previousTotalOrders = Array.from(previousCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const pendingValidationCount = counts.get(OrderStatus.PENDING_VALIDATION) ?? 0;
    const waitingStockCount = counts.get(OrderStatus.WAITING_STOCK) ?? 0;

    return {
      range: this.serializeRange(range),
      previousRange: this.serializeRange(previousRange),
      generatedAt: new Date().toISOString(),
      totalOrders,
      pendingValidationCount,
      waitingStockCount,
      awaitingPaymentCount: counts.get(OrderStatus.AWAITING_PAYMENT) ?? 0,
      paidCount: counts.get(OrderStatus.PAID) ?? 0,
      completedFlowCount:
        (counts.get(OrderStatus.SALE_CREATED) ?? 0) +
        (counts.get(OrderStatus.SHIPPED) ?? 0) +
        (counts.get(OrderStatus.DELIVERED) ?? 0),
      statuses,
      totalOrdersComparison: this.buildComparison(totalOrders, previousTotalOrders),
      pendingValidationComparison: this.buildComparison(
        pendingValidationCount,
        previousCounts.get(OrderStatus.PENDING_VALIDATION) ?? 0,
      ),
      waitingStockComparison: this.buildComparison(
        waitingStockCount,
        previousCounts.get(OrderStatus.WAITING_STOCK) ?? 0,
      ),
    };
  }

  async getActionableOrders(
    query: DashboardActionableOrdersQueryDto,
  ): Promise<DashboardActionableOrdersResponseDto> {
    const limit = query.limit ?? 10;
    const actionableStatuses = [
      OrderStatus.PENDING_VALIDATION,
      OrderStatus.WAITING_STOCK,
      OrderStatus.AWAITING_PAYMENT,
    ];

    const total = await this.orderRepository
      .createQueryBuilder('salesOrder')
      .where('salesOrder.status IN (:...statuses)', { statuses: actionableStatuses })
      .getCount();

    const orders = await this.orderRepository
      .createQueryBuilder('salesOrder')
      .leftJoinAndSelect('salesOrder.items', 'items')
      .where('salesOrder.status IN (:...statuses)', { statuses: actionableStatuses })
      .orderBy('salesOrder.createdAt', 'ASC')
      .limit(limit)
      .getMany();

    const now = Date.now();

    return {
      generatedAt: new Date().toISOString(),
      total,
      data: orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        customerName: `${order.firstName} ${order.lastName}`.trim(),
        email: order.email,
        paymentMethod: order.paymentMethod,
        itemsCount: order.items?.length ?? 0,
        ageHours: Number(
          (((now - order.createdAt.getTime()) / (1000 * 60 * 60))).toFixed(2),
        ),
      })),
    };
  }

  async getWaitingStockOrders(
    query: DashboardWaitingStockOrdersQueryDto,
  ): Promise<DashboardWaitingStockOrdersResponseDto> {
    const limit = query.limit ?? 10;

    const total = await this.orderRepository.count({
      where: { status: OrderStatus.WAITING_STOCK },
    });

    const orders = await this.orderRepository
      .createQueryBuilder('salesOrder')
      .leftJoinAndSelect('salesOrder.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('salesOrder.status = :status', { status: OrderStatus.WAITING_STOCK })
      .orderBy('salesOrder.createdAt', 'ASC')
      .limit(limit)
      .getMany();

    const productIds = Array.from(
      new Set(
        orders.flatMap((order) =>
          (order.items ?? [])
            .map((item) => item.productId)
            .filter((id): id is number => Number.isInteger(id)),
        ),
      ),
    );

    const inventories =
      productIds.length > 0
        ? await this.inventoryRepository.find({
            where: { productId: In(productIds) },
          })
        : [];

    const inventoryByProductId = new Map(
      inventories.map((inventory) => [inventory.productId, inventory]),
    );

    return {
      generatedAt: new Date().toISOString(),
      total,
      data: orders.map((order) => {
        const missingItems = (order.items ?? [])
          .map((item) => {
            const inventory = inventoryByProductId.get(item.productId);
            const quantityAvailable = inventory?.quantity ?? 0;
            const shortage = Math.max(item.quantity - quantityAvailable, 0);

            if (shortage <= 0) {
              return null;
            }

            return {
              orderItemId: item.id,
              productId: item.productId,
              productName: item.product?.name ?? 'Unknown product',
              vendorCode: item.product?.vendorCode ?? null,
              barcode: item.product?.barcode ?? null,
              quantityRequested: item.quantity,
              quantityAvailable,
              shortage,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        const totalUnitsShort = missingItems.reduce(
          (sum, missingItem) => sum + missingItem.shortage,
          0,
        );

        return {
          id: order.id,
          createdAt: order.createdAt,
          customerName: `${order.firstName} ${order.lastName}`.trim(),
          email: order.email,
          totalAmount: order.totalAmount,
          missingItemsCount: missingItems.length,
          totalUnitsShort,
          missingItems,
        };
      }),
    };
  }

  async getSalesTimeseries(
    query: DashboardTimeseriesQueryDto,
  ): Promise<DashboardSalesTimeseriesResponseDto> {
    const range = this.resolveRange(query);
    const granularity = query.granularity ?? DashboardGranularity.DAY;
    const bucketExpr =
      granularity === DashboardGranularity.MONTH
        ? "date_trunc('month', sale.createdAt)"
        : "date_trunc('day', sale.createdAt)";

    const rows = await this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin(SaleItem, 'item', 'item.saleId = sale.id')
      .select(`${bucketExpr}`, 'bucketStart')
      .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'salesAmount')
      .addSelect('COUNT(DISTINCT sale.id)', 'salesCount')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'itemsSold')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .groupBy(bucketExpr)
      .orderBy(bucketExpr, 'ASC')
      .getRawMany<{
        bucketStart: string;
        salesAmount: string;
        salesCount: string;
        itemsSold: string;
      }>();

    const rowsByBucket = new Map(
      rows.map((row) => [
        this.normalizeBucketDate(new Date(row.bucketStart), granularity),
        row,
      ]),
    );

    const data = this.buildBucketSeries(range, granularity).map((bucketStart) => {
      const row = rowsByBucket.get(bucketStart);
      return {
        bucketStart,
        salesAmount: Number(row?.salesAmount ?? 0),
        salesCount: Number(row?.salesCount ?? 0),
        itemsSold: Number(row?.itemsSold ?? 0),
      };
    });

    return {
      range: this.serializeRange(range),
      granularity,
      generatedAt: new Date().toISOString(),
      data,
    };
  }

  async getInventoryOverview(
    lowStockThreshold = 10,
  ): Promise<DashboardInventoryOverviewResponseDto> {
    const aggregation = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin(Inventory, 'inventory', 'inventory.productId = product.id')
      .select('COUNT(product.id)', 'trackedProductsCount')
      .addSelect('COALESCE(SUM(inventory.quantity), 0)', 'totalUnitsInStock')
      .addSelect(
        'COALESCE(SUM(inventory."reservedQuantity"), 0)',
        'totalReservedUnits',
      )
      .addSelect(
        'COUNT(CASE WHEN COALESCE(inventory.quantity, 0) = 0 THEN 1 END)',
        'outOfStockCount',
      )
      .addSelect(
        'COUNT(CASE WHEN COALESCE(inventory.quantity, 0) <= :threshold THEN 1 END)',
        'lowStockCount',
      )
      .where('product.deletedAt IS NULL')
      .andWhere('product.status != :archived', {
        archived: ProductStatus.ARCHIVED,
      })
      .setParameter('threshold', lowStockThreshold)
      .getRawOne<{
        trackedProductsCount: string;
        totalUnitsInStock: string;
        totalReservedUnits: string;
        outOfStockCount: string;
        lowStockCount: string;
      }>();

    return {
      generatedAt: new Date().toISOString(),
      lowStockThreshold,
      trackedProductsCount: Number(aggregation?.trackedProductsCount ?? 0),
      totalUnitsInStock: Number(aggregation?.totalUnitsInStock ?? 0),
      totalReservedUnits: Number(aggregation?.totalReservedUnits ?? 0),
      outOfStockCount: Number(aggregation?.outOfStockCount ?? 0),
      lowStockCount: Number(aggregation?.lowStockCount ?? 0),
    };
  }

  async getOrdersFunnel(
    query: DashboardRangeQueryDto,
  ): Promise<DashboardOrdersFunnelResponseDto> {
    const range = this.resolveRange(query);

    const rows = await this.orderRepository
      .createQueryBuilder('salesOrder')
      .select('salesOrder.status', 'status')
      .addSelect('COUNT(salesOrder.id)', 'count')
      .where('salesOrder.createdAt BETWEEN :startDate AND :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .groupBy('salesOrder.status')
      .getRawMany<{ status: OrderStatus; count: string }>();

    const counts = new Map<OrderStatus, number>(
      rows.map((row) => [row.status, Number(row.count)]),
    );

    const stageOrder: OrderStatus[] = [
      OrderStatus.PENDING_VALIDATION,
      OrderStatus.WAITING_STOCK,
      OrderStatus.VALIDATED,
      OrderStatus.AWAITING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.SALE_CREATED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];
    const exitOrder: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.EXPIRED];
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING_VALIDATION]: 'Pendiente de validacion',
      [OrderStatus.WAITING_STOCK]: 'Esperando stock',
      [OrderStatus.VALIDATED]: 'Validada',
      [OrderStatus.AWAITING_PAYMENT]: 'Esperando pago',
      [OrderStatus.PAID]: 'Pagada',
      [OrderStatus.SALE_CREATED]: 'Venta creada',
      [OrderStatus.SHIPPED]: 'Despachada',
      [OrderStatus.DELIVERED]: 'Entregada',
      [OrderStatus.CANCELLED]: 'Cancelada',
      [OrderStatus.EXPIRED]: 'Expirada',
    };

    let previousCount: number | null = null;
    const stages = stageOrder.map((status) => {
      const count = counts.get(status) ?? 0;
      const conversionFromPrevious =
        previousCount && previousCount > 0
          ? Number(((count / previousCount) * 100).toFixed(2))
          : null;
      previousCount = count;

      return {
        status,
        label: labels[status],
        count,
        conversionFromPrevious,
      };
    });

    const exits = exitOrder.map((status) => ({
      status,
      label: labels[status],
      count: counts.get(status) ?? 0,
      conversionFromPrevious: null,
    }));

    return {
      range: this.serializeRange(range),
      generatedAt: new Date().toISOString(),
      stages,
      exits,
    };
  }

  async getProductsOverview(): Promise<DashboardProductsOverviewResponseDto> {
    const rows = await this.productRepository
      .createQueryBuilder('product')
      .withDeleted()
      .select('product.status', 'status')
      .addSelect('COUNT(product.id)', 'count')
      .groupBy('product.status')
      .getRawMany<{ status: ProductStatus; count: string }>();

    const stockAggregation = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin(Inventory, 'inventory', 'inventory.productId = product.id')
      .select('COUNT(product.id)', 'totalProducts')
      .addSelect(
        'COUNT(CASE WHEN product."isPurchasable" = true THEN 1 END)',
        'purchasableProducts',
      )
      .addSelect(
        'COUNT(CASE WHEN product."isPurchasable" = false THEN 1 END)',
        'nonPurchasableProducts',
      )
      .addSelect(
        'COUNT(CASE WHEN COALESCE(inventory.quantity, 0) = 0 THEN 1 END)',
        'withoutStockProducts',
      )
      .where('product.deletedAt IS NULL')
      .getRawOne<{
        totalProducts: string;
        purchasableProducts: string;
        nonPurchasableProducts: string;
        withoutStockProducts: string;
      }>();

    const counts = new Map<ProductStatus, number>(
      rows.map((row) => [row.status, Number(row.count)]),
    );

    return {
      generatedAt: new Date().toISOString(),
      totalProducts: Number(stockAggregation?.totalProducts ?? 0),
      activeProducts: counts.get(ProductStatus.ACTIVE) ?? 0,
      inactiveProducts: counts.get(ProductStatus.INACTIVE) ?? 0,
      archivedProducts: counts.get(ProductStatus.ARCHIVED) ?? 0,
      purchasableProducts: Number(stockAggregation?.purchasableProducts ?? 0),
      nonPurchasableProducts: Number(
        stockAggregation?.nonPurchasableProducts ?? 0,
      ),
      withoutStockProducts: Number(stockAggregation?.withoutStockProducts ?? 0),
    };
  }

  async getTopSellingProducts(
    query: DashboardTopProductsQueryDto,
  ): Promise<DashboardTopProductsResponseDto> {
    const range = this.resolveRange(query);
    const limit = query.limit ?? 10;

    const rows = await this.saleItemRepository
      .createQueryBuilder('item')
      .innerJoin(Sale, 'sale', 'sale.id = item.saleId')
      .leftJoin(Product, 'product', 'product.id = item.productId')
      .leftJoin(Inventory, 'inventory', 'inventory.productId = item.productId')
      .select('item.productId', 'productId')
      .addSelect('MAX(COALESCE(product.name, item.productName))', 'productName')
      .addSelect('MAX(product.vendorCode)', 'vendorCode')
      .addSelect('MAX(product.barcode)', 'barcode')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'unitsSold')
      .addSelect('COALESCE(SUM(item.subtotal), 0)', 'revenue')
      .addSelect('COALESCE(MAX(inventory.quantity), 0)', 'currentStock')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .groupBy('item.productId')
      .orderBy('COALESCE(SUM(item.quantity), 0)', 'DESC')
      .addOrderBy('COALESCE(SUM(item.subtotal), 0)', 'DESC')
      .limit(limit)
      .getRawMany<{
        productId: string;
        productName: string;
        vendorCode: string | null;
        barcode: string | null;
        unitsSold: string;
        revenue: string;
        currentStock: string;
      }>();

    return {
      range: this.serializeRange(range),
      generatedAt: new Date().toISOString(),
      data: rows.map((row) => ({
        productId: this.toNumberOrZero(row.productId),
        productName: row.productName,
        vendorCode: row.vendorCode,
        barcode: row.barcode,
        unitsSold: this.toNumberOrZero(row.unitsSold),
        revenue: this.toNumberOrZero(row.revenue),
        currentStock: this.toNumberOrZero(row.currentStock),
      })),
    };
  }

  async getLowStockProducts(
    query: DashboardLowStockQueryDto,
  ): Promise<DashboardLowStockResponseDto> {
    const lowStockThreshold = query.lowStockThreshold ?? 10;
    const limit = query.limit ?? 10;

    const baseQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoin(Inventory, 'inventory', 'inventory.productId = product.id')
      .where('product.deletedAt IS NULL')
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('COALESCE(inventory.quantity, 0) <= :threshold', {
        threshold: lowStockThreshold,
      });

    const total = await baseQuery.getCount();

    const rows = await baseQuery
      .clone()
      .select('inventory.id', 'id')
      .addSelect('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.vendorCode', 'vendorCode')
      .addSelect('product.barcode', 'barcode')
      .addSelect('COALESCE(inventory.quantity, 0)', 'quantity')
      .addSelect('COALESCE(inventory."reservedQuantity", 0)', 'reservedQuantity')
      .addSelect('inventory.updatedAt', 'updatedAt')
      .orderBy('COALESCE(inventory.quantity, 0)', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .limit(limit)
      .getRawMany<{
        id: string | null;
        productId: string;
        productName: string;
        vendorCode: string | null;
        barcode: string | null;
        quantity: string;
        reservedQuantity: string;
        updatedAt: Date | null;
      }>();

    return {
      generatedAt: new Date().toISOString(),
      lowStockThreshold,
      total,
      data: rows.map((row) => {
        const quantity = this.toNumberOrZero(row.quantity);
        const reservedQuantity = this.toNumberOrZero(row.reservedQuantity);
        return {
          id: row.id,
          productId: this.toNumberOrZero(row.productId),
          productName: row.productName,
          vendorCode: row.vendorCode,
          barcode: row.barcode,
          quantity,
          stock: quantity,
          reservedQuantity,
          availableToSell: Math.max(quantity - reservedQuantity, 0),
          updatedAt: row.updatedAt,
        };
      }),
    };
  }

  async getAlerts(
    query: DashboardAlertsQueryDto,
  ): Promise<DashboardAlertsResponseDto> {
    const range = this.resolveRange(query);
    const lowStockThreshold = query.lowStockThreshold ?? 10;
    const limit = query.limit ?? 5;

    const [pendingValidationOrders, waitingStockOrders] = await Promise.all([
      this.orderRepository.count({
        where: { status: OrderStatus.PENDING_VALIDATION },
      }),
      this.orderRepository.count({ where: { status: OrderStatus.WAITING_STOCK } }),
    ]);

    const cancelledSalesCount = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.status = :status', { status: SaleStatus.CANCELLED })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .getCount();

    const outOfStockProducts = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin(Inventory, 'inventory', 'inventory.productId = product.id')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.vendorCode', 'vendorCode')
      .addSelect('product.barcode', 'barcode')
      .addSelect('COALESCE(inventory.quantity, 0)', 'quantity')
      .addSelect('COALESCE(inventory."reservedQuantity", 0)', 'reservedQuantity')
      .where('product.deletedAt IS NULL')
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('COALESCE(inventory.quantity, 0) = 0')
      .orderBy('product.name', 'ASC')
      .take(limit)
      .getRawMany<{
        productId: string;
        productName: string;
        vendorCode: string | null;
        barcode: string | null;
        quantity: string;
        reservedQuantity: string;
      }>();

    const lowStockProducts = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin(Inventory, 'inventory', 'inventory.productId = product.id')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.vendorCode', 'vendorCode')
      .addSelect('product.barcode', 'barcode')
      .addSelect('COALESCE(inventory.quantity, 0)', 'quantity')
      .addSelect('COALESCE(inventory."reservedQuantity", 0)', 'reservedQuantity')
      .where('product.deletedAt IS NULL')
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('COALESCE(inventory.quantity, 0) > 0')
      .andWhere('COALESCE(inventory.quantity, 0) <= :threshold', {
        threshold: lowStockThreshold,
      })
      .orderBy('COALESCE(inventory.quantity, 0)', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .take(limit)
      .getRawMany<{
        productId: string;
        productName: string;
        vendorCode: string | null;
        barcode: string | null;
        quantity: string;
        reservedQuantity: string;
      }>();

    return {
      range: this.serializeRange(range),
      generatedAt: new Date().toISOString(),
      lowStockThreshold,
      pendingValidationOrders,
      waitingStockOrders,
      cancelledSalesCount,
      outOfStockProducts: outOfStockProducts.map((item) =>
        this.mapAlertProduct(item),
      ),
      lowStockProducts: lowStockProducts.map((item) => this.mapAlertProduct(item)),
    };
  }

  private resolveRange(query: DashboardRangeQueryDto): DateRange {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid dashboard date range');
    }

    if (startDate > endDate) {
      throw new BadRequestException('startDate cannot be greater than endDate');
    }

    return { startDate, endDate };
  }

  private resolvePreviousRange(range: DateRange): DateRange {
    const spanMs = range.endDate.getTime() - range.startDate.getTime();
    const previousEndDate = new Date(range.startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - spanMs);

    return {
      startDate: previousStartDate,
      endDate: previousEndDate,
    };
  }

  private serializeRange(range: DateRange): { startDate: string; endDate: string } {
    return {
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
    };
  }

  private mapAlertProduct(item: {
    productId: string;
    productName: string;
    vendorCode: string | null;
    barcode: string | null;
    quantity: string;
    reservedQuantity: string;
  }) {
    const quantity = this.toNumberOrZero(item.quantity);
    return {
      productId: this.toNumberOrZero(item.productId),
      productName: item.productName,
      vendorCode: item.vendorCode,
      barcode: item.barcode,
      quantity,
      stock: quantity,
      reservedQuantity: this.toNumberOrZero(item.reservedQuantity),
    };
  }

  private toNumberOrZero(value: string | number | null | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private buildComparison(current: number, previous: number): NumericComparison {
    const delta = current - previous;

    return {
      current,
      previous,
      delta,
      deltaPercent:
        previous === 0 ? (current === 0 ? 0 : null) : Number(((delta / previous) * 100).toFixed(2)),
    };
  }

  private getCompletedSalesAggregation(range: DateRange) {
    return this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin(SaleItem, 'item', 'item.saleId = sale.id')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'totalSalesAmount')
      .addSelect('COUNT(DISTINCT sale.id)', 'totalSalesCount')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'totalItemsSold')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .getRawOne<{
        totalSalesAmount: string;
        totalSalesCount: string;
        totalItemsSold: string;
      }>();
  }

  private getCancelledSalesAggregation(range: DateRange) {
    return this.saleRepository
      .createQueryBuilder('sale')
      .select('COUNT(sale.id)', 'cancelledSalesCount')
      .where('sale.status = :status', { status: SaleStatus.CANCELLED })
      .andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .getRawOne<{ cancelledSalesCount: string }>();
  }

  private getOrderStatusCounts(range: DateRange) {
    return this.orderRepository
      .createQueryBuilder('salesOrder')
      .select('salesOrder.status', 'status')
      .addSelect('COUNT(salesOrder.id)', 'count')
      .where('salesOrder.createdAt BETWEEN :startDate AND :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .groupBy('salesOrder.status')
      .getRawMany<{ status: OrderStatus; count: string }>();
  }

  private buildBucketSeries(
    range: DateRange,
    granularity: DashboardGranularity,
  ): string[] {
    const buckets: string[] = [];
    const cursor = this.getBucketStart(range.startDate, granularity);
    const endBucket = this.getBucketStart(range.endDate, granularity);

    while (cursor <= endBucket) {
      buckets.push(this.normalizeBucketDate(cursor, granularity));
      if (granularity === DashboardGranularity.MONTH) {
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      } else {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    return buckets;
  }

  private getBucketStart(
    date: Date,
    granularity: DashboardGranularity,
  ): Date {
    if (granularity === DashboardGranularity.MONTH) {
      return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0),
      );
    }

    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
  }

  private normalizeBucketDate(
    date: Date,
    granularity: DashboardGranularity,
  ): string {
    return this.getBucketStart(date, granularity).toISOString();
  }
}