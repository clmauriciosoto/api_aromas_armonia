import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderReviewNotificationSettings1762800000000
  implements MigrationInterface
{
  name = 'AddOrderReviewNotificationSettings1762800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_feature_settings"
      ADD COLUMN IF NOT EXISTS "notifyNewOrderEnabled" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "order_feature_settings"
      ADD COLUMN IF NOT EXISTS "notifyNewOrderRecipients" text[] NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_feature_settings"
      DROP COLUMN IF EXISTS "notifyNewOrderRecipients"
    `);

    await queryRunner.query(`
      ALTER TABLE "order_feature_settings"
      DROP COLUMN IF EXISTS "notifyNewOrderEnabled"
    `);
  }
}
