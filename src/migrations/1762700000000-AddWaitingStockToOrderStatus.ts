import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaitingStockToOrderStatus1762700000000
  implements MigrationInterface
{
  name = 'AddWaitingStockToOrderStatus1762700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'order_status_enum'
            AND e.enumlabel = 'WAITING_STOCK'
        ) THEN
          ALTER TYPE "order_status_enum" ADD VALUE 'WAITING_STOCK';
        END IF;
      END
      $$
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ADD COLUMN IF NOT EXISTS "estimatedRestockDate" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order"
      DROP COLUMN IF EXISTS "estimatedRestockDate"
    `);

    await queryRunner.query(`
      CREATE TYPE "order_status_enum_old" AS ENUM (
        'PENDING_VALIDATION',
        'VALIDATED',
        'AWAITING_PAYMENT',
        'PAID',
        'SALE_CREATED',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'EXPIRED'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ALTER COLUMN "status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ALTER COLUMN "status" TYPE text
      USING "status"::text
    `);

    await queryRunner.query(`
      ALTER TABLE "sales"
      ALTER COLUMN "orderStatusBeforeSale" TYPE text
      USING "orderStatusBeforeSale"::text
    `);

    await queryRunner.query(`
      DROP TYPE "order_status_enum"
    `);

    await queryRunner.query(`
      ALTER TYPE "order_status_enum_old" RENAME TO "order_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ALTER COLUMN "status" TYPE "order_status_enum"
      USING (
        CASE "status"
          WHEN 'WAITING_STOCK' THEN 'PENDING_VALIDATION'
          ELSE "status"
        END
      )::"order_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales"
      ALTER COLUMN "orderStatusBeforeSale" TYPE "order_status_enum"
      USING (
        CASE "orderStatusBeforeSale"
          WHEN 'WAITING_STOCK' THEN 'PENDING_VALIDATION'
          ELSE "orderStatusBeforeSale"
        END
      )::"order_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ALTER COLUMN "status" SET DEFAULT 'PENDING_VALIDATION'
    `);
  }
}
