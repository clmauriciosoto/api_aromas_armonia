export interface OrderItemChangeHistoryEntry {
  action: 'CREATED' | 'QUANTITY_UPDATED' | 'REPLACED' | 'MARKED_REMOVED';
  changedAt: Date;
  note?: string;
  previousQuantity?: number;
  newQuantity?: number;
  previousProductId?: number;
  newProductId?: number;
}
