import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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
import { InventoryService } from '../inventory/inventory.service';

interface AuthenticatedUser {
  id?: string;
  sub?: string;
  role?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const { items } = createOrderDto;

    if (!items?.length) {
      throw new BadRequestException('Order must include at least one item');
    }

    return this.dataSource.transaction(async (manager) => {
      const productQuantities = new Map<number, number>();

      for (const item of items) {
        const previous = productQuantities.get(item.productId) ?? 0;
        productQuantities.set(item.productId, previous + item.quantity);
      }

      const productIdsToLock = [...productQuantities.keys()].sort(
        (a, b) => a - b,
      );
      for (const productId of productIdsToLock) {
        const quantity = productQuantities.get(productId) ?? 0;
        await this.inventoryService.decreaseStock(productId, quantity, manager);
      }

      let totalAmount = 0;
      const orderItems: OrderItem[] = [];
      const productCache = new Map<number, Product>();

      for (const item of items) {
        let product: Product | null = productCache.get(item.productId) ?? null;
        if (!product) {
          product = await manager.getRepository(Product).findOne({
            where: { id: item.productId },
          });
          if (!product) {
            throw new NotFoundException(
              `Product with id ${item.productId} not found`,
            );
          }
          productCache.set(item.productId, product);
        }

        const unitPrice = Number(product.discountPrice ?? product.price);

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new BadRequestException(
            `Product with id ${item.productId} has invalid pricing`,
          );
        }

        const subtotal = unitPrice * item.quantity;
        totalAmount += subtotal;

        const orderItem = manager.getRepository(OrderItem).create({
          product,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
        orderItems.push(orderItem);
      }

      const { items: _ignoredItems, ...shippingData } = createOrderDto;
      void _ignoredItems;
      const order = manager.getRepository(Order).create({
        ...shippingData,
        totalAmount,
        items: orderItems,
      });

      return manager.getRepository(Order).save(order);
    });
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

    return {
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
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
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
}
