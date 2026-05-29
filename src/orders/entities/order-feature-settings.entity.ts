import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'order_feature_settings' })
export class OrderFeatureSettings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'boolean', default: true })
  cartEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  checkoutEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  notifyNewOrderEnabled: boolean;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  notifyNewOrderRecipients: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
