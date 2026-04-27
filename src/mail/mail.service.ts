import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Order } from '../orders/entities/order.entity';
import { OrderItemStatus } from '../orders/entities/order-item-status.enum';
import { PaymentMethod } from '../orders/entities/payment-method.enum';
import { OrderStatus } from '../orders/entities/order-status.enum';

export interface SendValidationEmailOptions {
  order: Order;
  nextStatus: OrderStatus;
  note?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendOrderCreatedEmail(order: Order): Promise<void> {
    const activeItems = (order.items ?? []).filter(
      (item) => item.status !== OrderItemStatus.REMOVED,
    );

    const products = activeItems.map((item) => ({
      name: item.product?.name ?? `Producto #${item.productId}`,
      imageUrl: this.getProductImageUrl(item.product),
      quantity: item.quantity,
      unitPriceFormatted: this.formatCurrency(item.unitPrice),
      subtotalFormatted: this.formatCurrency(item.subtotal),
    }));

    try {
      await this.mailerService.sendMail({
        to: order.email,
        subject: `Recibimos tu pedido #${order.id}`,
        template: 'order-created-v2',
        context: {
          ...this.buildBaseContext(order),
          products,
        },
      });
      this.logger.log(
        `Order created email sent to ${order.email} for order #${order.id}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send order created email for order #${order.id}: ${(err as Error).message}`,
      );
    }
  }

  async sendOrderValidationEmail(
    opts: SendValidationEmailOptions,
  ): Promise<void> {
    const { order, nextStatus, note } = opts;

    const templateMap: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.VALIDATED]: 'order-validated',
      [OrderStatus.WAITING_STOCK]: 'order-waiting-stock',
      [OrderStatus.CANCELLED]: 'order-cancelled',
    };

    const subjectMap: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.VALIDATED]: `Tu pedido #${order.id} fue confirmado ✅`,
      [OrderStatus.WAITING_STOCK]: `Tu pedido #${order.id} está en espera de stock ⏳`,
      [OrderStatus.CANCELLED]: `Tu pedido #${order.id} fue cancelado`,
    };

    const template = templateMap[nextStatus];
    if (!template) return;

    try {
      await this.mailerService.sendMail({
        to: order.email,
        subject: subjectMap[nextStatus],
        template,
        context: {
          ...this.buildBaseContext(order),
          note: note ?? null,
        },
      });
      this.logger.log(
        `Validation email (${nextStatus}) sent to ${order.email} for order #${order.id}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send validation email for order #${order.id}: ${(err as Error).message}`,
      );
    }
  }

  private buildBaseContext(order: Order) {
    const restockDateValue = order.estimatedRestockDate
      ? new Date(order.estimatedRestockDate as string | number | Date)
      : null;

    const estimatedRestockDate = restockDateValue
      ? new Intl.DateTimeFormat('es-CL', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }).format(restockDateValue)
      : null;

    return {
      orderId: order.id,
      firstName: order.firstName,
      lastName: order.lastName,
      totalFormatted: this.formatCurrency(order.totalAmount),
      paymentMethodLabel:
        order.paymentMethod === PaymentMethod.BANK_TRANSFER
          ? 'Transferencia bancaria'
          : 'Link de pago',
      address: order.address,
      phone: order.phone,
      estimatedRestockDate,
    };
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  }

  private getProductImageUrl(
    orderProduct: Order['items'][number]['product'] | undefined,
  ): string | null {
    if (!orderProduct) {
      return null;
    }

    const primaryImage = orderProduct.images?.find((image) => image.isPrimary);
    const firstImage = orderProduct.images
      ?.slice()
      .sort((left, right) => left.position - right.position)[0];

    return primaryImage?.url ?? firstImage?.url ?? orderProduct.image ?? null;
  }
}
