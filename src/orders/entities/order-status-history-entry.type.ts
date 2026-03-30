import { OrderStatus } from './order-status.enum';

export interface OrderStatusHistoryEntry {
  from: OrderStatus | null;
  to: OrderStatus;
  changedAt: Date;
  note?: string;
}
