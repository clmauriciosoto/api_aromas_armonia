import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Product } from 'src/products/entities/product.entity';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { PaginatedOrdersResponseDto } from './dto/paginated-orders-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { OrderFeatureSettings } from './entities/order-feature-settings.entity';
import { OrderFeatureSettingsResponseDto } from './dto/order-feature-settings-response.dto';
import { UpdateOrderFeatureSettingsDto } from './dto/update-order-feature-settings.dto';
import { OrderStatus } from './entities/order-status.enum';
import { OrderStatusHistoryEntry } from './entities/order-status-history-entry.type';
import { Inventory } from '../inventory/entities/inventory.entity';
import { OrderValidationResponseDto, OrderValidationItemDto } from './dto/order-validation-response.dto';
import { OrderAdjustmentDto } from './dto/order-adjustment.dto';
import { OrderItemStatus } from './entities/order-item-status.enum';
import { OrderItemChangeHistoryEntry } from './entities/order-item-change-history-entry.type';
import { ProductStatus } from '../products/entities/product-status.enum';
import { ValidateOrderDecision, ValidateOrderDto } from './dto/validate-order.dto';
import { MailService } from '../mail/mail.service';

interface AuthenticatedUser {
  id?: string;
  sub?: string;
  role?: string;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  private readonly allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> =
    {
      [OrderStatus.PENDING_VALIDATION]: [
        OrderStatus.VALIDATED,
        OrderStatus.WAITING_STOCK,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.WAITING_STOCK]: [
        OrderStatus.VALIDATED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.VALIDATED]: [
        OrderStatus.AWAITING_PAYMENT,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.AWAITING_PAYMENT]: [
        OrderStatus.PAID,
        OrderStatus.EXPIRED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PAID]: [OrderStatus.SALE_CREATED],
      [OrderStatus.SALE_CREATED]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.EXPIRED]: [],
    };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(OrderFeatureSettings)
    private readonly orderFeatureSettingsRepository: Repository<OrderFeatureSettings>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  private async getOrCreateFeatureSettings(): Promise<OrderFeatureSettings> {
    let settings = await this.orderFeatureSettingsRepository.findOne({
      where: { id: 1 },
    });

    if (!settings) {
      settings = this.orderFeatureSettingsRepository.create({
        id: 1,
        cartEnabled: true,
        checkoutEnabled: true,
      });
      settings = await this.orderFeatureSettingsRepository.save(settings);
    }

    return settings;
  }

  async getFeatureSettings(): Promise<OrderFeatureSettingsResponseDto> {
    const settings = await this.getOrCreateFeatureSettings();
    return {
      cartEnabled: settings.cartEnabled,
      checkoutEnabled: settings.checkoutEnabled,
    };
  }

  async updateFeatureSettings(
    payload: UpdateOrderFeatureSettingsDto,
  ): Promise<OrderFeatureSettingsResponseDto> {
    if (
      typeof payload.cartEnabled === 'undefined' &&
      typeof payload.checkoutEnabled === 'undefined'
    ) {
      throw new BadRequestException(
        'At least one setting must be provided: cartEnabled or checkoutEnabled',
      );
    }

    const settings = await this.getOrCreateFeatureSettings();

    if (typeof payload.cartEnabled !== 'undefined') {
      settings.cartEnabled = payload.cartEnabled;
    }

    if (typeof payload.checkoutEnabled !== 'undefined') {
      settings.checkoutEnabled = payload.checkoutEnabled;
    }

    const updated = await this.orderFeatureSettingsRepository.save(settings);

    return {
      cartEnabled: updated.cartEnabled,
      checkoutEnabled: updated.checkoutEnabled,
    };
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const settings = await this.getFeatureSettings();

    if (!settings.checkoutEnabled) {
      throw new ForbiddenException(
        'Order confirmation is currently disabled',
      );
    }

    const { items } = createOrderDto;

    if (!items?.length) {
      throw new BadRequestException('Order must include at least one item');
    }

    const order = await this.dataSource.transaction(async (manager) => {
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];
      const productCache = new Map<number, Product>();

      for (const item of items) {
        let product: Product | null = productCache.get(item.productId) ?? null;
        if (!product) {
          product = await manager.getRepository(Product).findOne({
            where: { id: item.productId },
            relations: ['images'],
          });
          if (!product) {
            throw new NotFoundException(
              `Product with id ${item.productId} not found`,
            );
          }
          productCache.set(item.productId, product);
        }

        const unitPrice = this.resolveEffectiveUnitPrice(product, item.productId);

        const subtotal = unitPrice * item.quantity;
        totalAmount += subtotal;

        const orderItem = manager.getRepository(OrderItem).create({
          product,
          quantity: item.quantity,
          unitPrice,
          subtotal,
          status: OrderItemStatus.ACTIVE,
          changeHistory: [
            {
              action: 'CREATED',
              changedAt: new Date(),
              note: 'Order item created',
              newQuantity: item.quantity,
            },
          ],
        });
        orderItems.push(orderItem);
      }

      const { items: _ignoredItems, ...shippingData } = createOrderDto;
      void _ignoredItems;
      const order = manager.getRepository(Order).create({
        ...shippingData,
        status: OrderStatus.PENDING_VALIDATION,
        statusHistory: [
          {
            from: null,
            to: OrderStatus.PENDING_VALIDATION,
            changedAt: new Date(),
            note: 'Order created',
          },
        ],
        paymentMethodSelected: shippingData.paymentMethod,
        totalAmount,
        items: orderItems,
      });

      const savedOrder = await manager.getRepository(Order).save(order);
      savedOrder.items = orderItems;

      return savedOrder;
    });

    void this.mailService.sendOrderCreatedEmail(order);

    return order;
  }

  async validateOrderStock(orderId: number): Promise<Order> {
    return this.transitionOrderStatus(orderId, OrderStatus.VALIDATED);
  }

  async requestPayment(orderId: number): Promise<Order> {
    return this.transitionOrderStatus(orderId, OrderStatus.AWAITING_PAYMENT);
  }

  async confirmPayment(orderId: number): Promise<Order> {
    return this.transitionOrderStatus(orderId, OrderStatus.PAID);
  }

  async createSale(orderId: number): Promise<Order> {
    return this.transitionOrderStatus(orderId, OrderStatus.SALE_CREATED);
  }

  async shipOrder(orderId: number): Promise<Order> {
    return this.transitionOrderStatus(orderId, OrderStatus.SHIPPED);
  }

  async deliverOrder(orderId: number): Promise<Order> {
    return this.transitionOrderStatus(orderId, OrderStatus.DELIVERED);
  }

  async cancelOrder(orderId: number): Promise<Order> {
    return this.transitionOrderStatus(orderId, OrderStatus.CANCELLED);
  }

  async expireOrder(orderId: number): Promise<Order> {
    return this.transitionOrderStatus(orderId, OrderStatus.EXPIRED);
  }

  async validateOrder(orderId: string, dto: ValidateOrderDto): Promise<Order> {
    const parsedOrderId = Number(orderId);
    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      throw new BadRequestException('Invalid orderId');
    }

    const order = await this.orderRepository.findOne({
      where: { id: parsedOrderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${parsedOrderId} not found`);
    }

    if (
      order.status !== OrderStatus.PENDING_VALIDATION &&
      order.status !== OrderStatus.WAITING_STOCK
    ) {
      throw new ConflictException(
        `Order ${parsedOrderId} cannot be re-validated from status ${order.status}`,
      );
    }

    let nextStatus: OrderStatus;
    if (dto.decision === ValidateOrderDecision.VALIDATED) {
      nextStatus = OrderStatus.VALIDATED;
      order.estimatedRestockDate = null;
    } else if (dto.decision === ValidateOrderDecision.WAITING_STOCK) {
      if (!(dto.estimatedRestockDate instanceof Date)) {
        throw new BadRequestException(
          'estimatedRestockDate is required when decision is WAITING_STOCK',
        );
      }
      nextStatus = OrderStatus.WAITING_STOCK;
      order.estimatedRestockDate = dto.estimatedRestockDate;
    } else {
      nextStatus = OrderStatus.CANCELLED;
      order.estimatedRestockDate = null;
    }

    this.assertTransitionAllowed(order.status, nextStatus);

    const history = Array.isArray(order.statusHistory)
      ? [...order.statusHistory]
      : [];

    const noteParts = [dto.note?.trim()].filter(Boolean) as string[];
    if (nextStatus === OrderStatus.WAITING_STOCK && order.estimatedRestockDate) {
      noteParts.push(
        `Estimated restock date: ${order.estimatedRestockDate.toISOString()}`,
      );
    }

    history.push(
      this.buildStatusHistoryEntry(
        order.status,
        nextStatus,
        noteParts.join(' | ') || 'Manual validation decision applied',
      ),
    );

    order.status = nextStatus;
    order.statusHistory = history;

    this.logger.log(
      `Order ${parsedOrderId} validation decision ${dto.decision} applied. New status: ${nextStatus}`,
    );

    const saved = await this.orderRepository.save(order);

    void this.mailService.sendOrderValidationEmail({
      order: saved,
      nextStatus,
      note: dto.note,
    });

    return saved;
  }

  async validateOrderWithStock(orderId: number): Promise<OrderValidationResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    const validationItems: OrderValidationItemDto[] = [];
    let totalAmount = 0;
    let allAvailable = true;
    let warningsCount = 0;

    const activeItems = (order.items ?? []).filter(
      (item) => item.status === OrderItemStatus.ACTIVE,
    );

    for (const orderItem of activeItems) {
      const inventory = await this.inventoryRepository.findOne({
        where: { productId: orderItem.productId },
      });

      const quantityAvailable = inventory?.quantity ?? 0;
      const isAvailable = quantityAvailable >= orderItem.quantity;
      const warning = !isAvailable
        ? `Stock insuficiente. Solicitados: ${orderItem.quantity}, Disponibles: ${quantityAvailable}`
        : null;

      const subtotal = orderItem.unitPrice * orderItem.quantity;
      totalAmount += subtotal;

      if (!isAvailable) {
        allAvailable = false;
        warningsCount++;
      }

      validationItems.push({
        id: orderItem.id,
        productId: orderItem.productId,
        productName: orderItem.product.name,
        quantityRequested: orderItem.quantity,
        quantityAvailable,
        isAvailable,
        warning,
        unitPrice: orderItem.unitPrice,
        subtotal,
      });
    }

    const suggestedActions: string[] = [];
    if (!allAvailable) {
      suggestedActions.push('Omitir productos con stock insuficiente');
      suggestedActions.push('Reducir cantidades');
      suggestedActions.push('Reemplazar por otro producto');
    }

    return {
      orderId: order.id,
      orderStatus: order.status,
      totalAmount,
      items: validationItems,
      allItemsAvailable: allAvailable,
      itemsWithWarnings: warningsCount,
      summary: allAvailable
        ? 'Todos los productos están disponibles. La orden puede proceder a pago.'
        : `Hay ${warningsCount} producto(s) con stock insuficiente. Ajusta la orden antes de continuar.`,
      suggestedActions,
    };
  }

  async adjustOrderItems(
    orderId: number,
    adjustmentDto: OrderAdjustmentDto,
  ): Promise<OrderValidationResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.getRepository(Order).findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException(`Order with id ${orderId} not found`);
      }

      order.items = await manager.getRepository(OrderItem).find({
        where: { order: { id: orderId } },
        relations: ['product'],
      });

      if (!Array.isArray(adjustmentDto.adjustments)) {
        throw new BadRequestException('adjustments debe ser un array');
      }

      for (const adjustment of adjustmentDto.adjustments) {
        if (adjustment.addProductId && adjustment.addQuantity) {
          const productToAdd = await manager.getRepository(Product).findOne({
            where: { id: adjustment.addProductId },
          });

          if (!productToAdd) {
            throw new NotFoundException(
              `Product with id ${adjustment.addProductId} not found`,
            );
          }

          if (
            productToAdd.deletedAt !== null ||
            productToAdd.status === ProductStatus.ARCHIVED ||
            !productToAdd.isPurchasable
          ) {
            throw new BadRequestException(
              `Product with id ${adjustment.addProductId} is not available for order`,
            );
          }

          const unitPrice = this.resolveEffectiveUnitPrice(
            productToAdd,
            adjustment.addProductId,
          );

          const subtotal = unitPrice * adjustment.addQuantity;
          const newOrderItem = manager.getRepository(OrderItem).create({
            order,
            product: productToAdd,
            productId: productToAdd.id,
            quantity: adjustment.addQuantity,
            unitPrice,
            subtotal,
            status: OrderItemStatus.ACTIVE,
            changeHistory: [
              {
                action: 'CREATED',
                changedAt: new Date(),
                note: 'Item added by admin adjustment',
                newQuantity: adjustment.addQuantity,
              },
            ],
          });
          await manager.getRepository(OrderItem).save(newOrderItem);
        }

        if (adjustment.removeItemId) {
          const itemToRemove = order.items?.find(
            (item) =>
              item.id === adjustment.removeItemId &&
              item.status === OrderItemStatus.ACTIVE,
          );
          if (!itemToRemove) {
            throw new NotFoundException(
              `Order item with id ${adjustment.removeItemId} not found`,
            );
          }

          itemToRemove.status = OrderItemStatus.REMOVED;
          itemToRemove.changeHistory = this.appendItemChangeHistory(
            itemToRemove.changeHistory,
            {
              action: 'MARKED_REMOVED',
              changedAt: new Date(),
              note: 'Item removed from order before validation',
            },
          );
          await manager.getRepository(OrderItem).save(itemToRemove);
        }

        if (adjustment.itemIdToAdjust && adjustment.newQuantity) {
          const itemToAdjust = order.items?.find(
            (item) =>
              item.id === adjustment.itemIdToAdjust &&
              item.status === OrderItemStatus.ACTIVE,
          );
          if (!itemToAdjust) {
            throw new NotFoundException(
              `Order item with id ${adjustment.itemIdToAdjust} not found`,
            );
          }
          const previousQuantity = itemToAdjust.quantity;
          const subtotal = itemToAdjust.unitPrice * adjustment.newQuantity;
          itemToAdjust.quantity = adjustment.newQuantity;
          itemToAdjust.subtotal = subtotal;
          itemToAdjust.changeHistory = this.appendItemChangeHistory(
            itemToAdjust.changeHistory,
            {
              action: 'QUANTITY_UPDATED',
              changedAt: new Date(),
              previousQuantity,
              newQuantity: adjustment.newQuantity,
            },
          );
          await manager.getRepository(OrderItem).save(itemToAdjust);
        }

        if (adjustment.itemIdToReplace && adjustment.replacementProductId) {
          const itemToReplace = order.items?.find(
            (item) =>
              item.id === adjustment.itemIdToReplace &&
              item.status === OrderItemStatus.ACTIVE,
          );
          if (!itemToReplace) {
            throw new NotFoundException(
              `Order item with id ${adjustment.itemIdToReplace} not found`,
            );
          }

          const replacementProduct = await manager
            .getRepository(Product)
            .findOne({
              where: { id: adjustment.replacementProductId },
            });
          if (!replacementProduct) {
            throw new NotFoundException(
              `Product with id ${adjustment.replacementProductId} not found`,
            );
          }

          const newQuantity =
            adjustment.replacementQuantity ?? itemToReplace.quantity;
          const unitPrice = this.resolveEffectiveUnitPrice(
            replacementProduct,
            adjustment.replacementProductId,
          );
          const subtotal = unitPrice * newQuantity;
          const previousProductId = itemToReplace.productId;
          const previousQuantity = itemToReplace.quantity;

          itemToReplace.productId = adjustment.replacementProductId;
          itemToReplace.product = replacementProduct;
          itemToReplace.quantity = newQuantity;
          itemToReplace.unitPrice = unitPrice;
          itemToReplace.subtotal = subtotal;
          itemToReplace.changeHistory = this.appendItemChangeHistory(
            itemToReplace.changeHistory,
            {
              action: 'REPLACED',
              changedAt: new Date(),
              previousProductId,
              newProductId: adjustment.replacementProductId,
              previousQuantity,
              newQuantity,
            },
          );
          await manager.getRepository(OrderItem).save(itemToReplace);
        }
      }

      order.items = await manager.getRepository(OrderItem).find({
        where: { order: { id: orderId }, status: OrderItemStatus.ACTIVE },
        relations: ['product'],
      });

      const recalculatedTotal = (order.items ?? []).reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );

      await manager.getRepository(Order).update(order.id, {
        totalAmount: recalculatedTotal,
      });

      order.totalAmount = recalculatedTotal;

      return this.buildValidationResponse(order);
    });
  }

  async confirmOrderValidation(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    const activeItems = (order.items ?? []).filter(
      (item) => item.status === OrderItemStatus.ACTIVE,
    );

    if (!activeItems.length) {
      throw new BadRequestException(
        'Order must have at least one item to be validated',
      );
    }

    return this.transitionOrderStatus(
      orderId,
      OrderStatus.VALIDATED,
      'Order items validated and quantities confirmed',
    );
  }

  private async buildValidationResponse(
    order: Order & { items?: OrderItem[] },
  ): Promise<OrderValidationResponseDto> {
    const validationItems: OrderValidationItemDto[] = [];
    let totalAmount = 0;
    let allAvailable = true;
    let warningsCount = 0;

    const activeItems = (order.items ?? []).filter(
      (item) => item.status === OrderItemStatus.ACTIVE,
    );

    for (const orderItem of activeItems) {
      const inventory = await this.inventoryRepository.findOne({
        where: { productId: orderItem.productId },
      });

      const quantityAvailable = inventory?.quantity ?? 0;
      const isAvailable = quantityAvailable >= orderItem.quantity;
      const warning = !isAvailable
        ? `Stock insuficiente. Solicitados: ${orderItem.quantity}, Disponibles: ${quantityAvailable}`
        : null;

      const subtotal = orderItem.unitPrice * orderItem.quantity;
      totalAmount += subtotal;

      if (!isAvailable) {
        allAvailable = false;
        warningsCount++;
      }

      validationItems.push({
        id: orderItem.id,
        productId: orderItem.productId,
        productName: orderItem.product?.name ?? 'Unknown',
        quantityRequested: orderItem.quantity,
        quantityAvailable,
        isAvailable,
        warning,
        unitPrice: orderItem.unitPrice,
        subtotal,
      });
    }

    const suggestedActions: string[] = [];
    if (!allAvailable) {
      suggestedActions.push('Omitir productos con stock insuficiente');
      suggestedActions.push('Reducir cantidades');
      suggestedActions.push('Reemplazar por otro producto');
    }

    return {
      orderId: order.id,
      orderStatus: order.status,
      totalAmount,
      items: validationItems,
      allItemsAvailable: allAvailable,
      itemsWithWarnings: warningsCount,
      summary: allAvailable
        ? 'Todos los productos están disponibles. La orden puede proceder a pago.'
        : `Hay ${warningsCount} producto(s) con stock insuficiente. Ajusta la orden antes de continuar.`,
      suggestedActions,
    };
  }

  async findAll(
    user: AuthenticatedUser,
    query: GetOrdersQueryDto,
  ): Promise<PaginatedOrdersResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.orderRepository.createQueryBuilder('order');

    qb.select([
      'order.id',
      'order.status',
      'order.totalAmount',
      'order.createdAt',
      'order.firstName',
      'order.lastName',
      'order.email',
      'order.phone',
      'order.address',
      'order.paymentMethod',
    ]);

    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Orders access for non-admin users is not available until ownership mapping is implemented',
      );
    }

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.startDate) {
      qb.andWhere('order.createdAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('order.createdAt <= :endDate', { endDate: query.endDate });
    }

    qb.skip(skip).take(limit).orderBy('order.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        phone: order.phone,
        address: order.address,
        paymentMethod: order.paymentMethod,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneById(
    id: number,
    user: AuthenticatedUser,
  ): Promise<OrderDetailResponseDto> {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admin users can access order detail');
    }

    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.id = :id', { id })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const items = await Promise.all(
      (order.items ?? [])
        .filter((item) => item.status === OrderItemStatus.ACTIVE)
        .map(async (item) => {
        const inventory = await this.inventoryRepository.findOne({
          where: { productId: item.productId },
        });
        const quantityAvailable = inventory?.quantity ?? 0;

        return {
          id: item.id,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          quantityAvailable,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        };
        }),
    );

    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      estimatedRestockDate: order.estimatedRestockDate,
      createdAt: order.createdAt,
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      phone: order.phone,
      address: order.address,
      paymentMethod: order.paymentMethod,
      items,
    };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  private async transitionOrderStatus(
    orderId: number,
    nextStatus: OrderStatus,
    note?: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    this.assertTransitionAllowed(order.status, nextStatus);

    const history = Array.isArray(order.statusHistory)
      ? [...order.statusHistory]
      : [];
    history.push(this.buildStatusHistoryEntry(order.status, nextStatus, note));

    order.status = nextStatus;
    order.statusHistory = history;

    return this.orderRepository.save(order);
  }

  private assertTransitionAllowed(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
  ): void {
    const allowed = this.allowedTransitions[currentStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new ConflictException(
        `Invalid transition from ${currentStatus} to ${nextStatus}`,
      );
    }
  }

  private buildStatusHistoryEntry(
    from: OrderStatus | null,
    to: OrderStatus,
    note?: string,
  ): OrderStatusHistoryEntry {
    return {
      from,
      to,
      changedAt: new Date(),
      ...(note ? { note } : {}),
    };
  }

  private appendItemChangeHistory(
    history: OrderItemChangeHistoryEntry[] | null | undefined,
    change: OrderItemChangeHistoryEntry,
  ): OrderItemChangeHistoryEntry[] {
    const currentHistory = Array.isArray(history) ? history : [];
    return [...currentHistory, change];
  }

  private resolveEffectiveUnitPrice(product: Product, productId: number): number {
    const price = Number(product.price);
    const discountAmount = Number(product.discountPrice ?? 0);

    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException(
        `Product with id ${productId} has invalid pricing`,
      );
    }

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      throw new BadRequestException(
        `Product with id ${productId} has invalid discount pricing`,
      );
    }

    const hasDiscount = discountAmount > 0;
    const unitPrice = hasDiscount ? price - discountAmount : price;

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new BadRequestException(
        `Product with id ${productId} has invalid effective pricing`,
      );
    }

    return unitPrice;
  }
}

export { OrdersService as OrderService };
