import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderWorkflowStateMachine1762500000000
  implements MigrationInterface
{
  name = 'OrderWorkflowStateMachine1762500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "order_status_enum_new" AS ENUM (
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
      ALTER TYPE "order_status_enum_new" RENAME TO "order_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ALTER COLUMN "status" TYPE "order_status_enum"
      USING (
        CASE "status"
          WHEN 'PENDING' THEN 'PENDING_VALIDATION'
          WHEN 'PAID' THEN 'PAID'
          WHEN 'SOLD' THEN 'SALE_CREATED'
          WHEN 'CANCELLED' THEN 'CANCELLED'
          ELSE 'PENDING_VALIDATION'
        END
      )::"order_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales"
      ALTER COLUMN "orderStatusBeforeSale" TYPE "order_status_enum"
      USING (
        CASE "orderStatusBeforeSale"
          WHEN 'PENDING' THEN 'PENDING_VALIDATION'
          WHEN 'PAID' THEN 'PAID'
          WHEN 'SOLD' THEN 'SALE_CREATED'
          WHEN 'CANCELLED' THEN 'CANCELLED'
          ELSE NULL
        END
      )::"order_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ALTER COLUMN "status" SET DEFAULT 'PENDING_VALIDATION'
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ADD COLUMN IF NOT EXISTS "statusHistory" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      UPDATE "order"
      SET "statusHistory" = jsonb_build_array(
        jsonb_build_object(
          'from', NULL,
          'to', "status"::text,
          'changedAt', COALESCE("updatedAt", "createdAt", NOW()),
          'note', 'Initial history migrated'
        )
      )
      WHERE "statusHistory" IS NULL
         OR jsonb_typeof("statusHistory") <> 'array'
         OR jsonb_array_length("statusHistory") = 0
    `);

    await queryRunner.query(`
      DO $$
      DECLARE payment_enum_type text;
      BEGIN
        SELECT c.udt_name
        INTO payment_enum_type
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'order'
          AND c.column_name = 'paymentMethod';

        IF payment_enum_type IS NOT NULL THEN
          EXECUTE format(
            'ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "paymentMethodSelected" %I',
            payment_enum_type
          );
        ELSE
          ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "paymentMethodSelected" text;
        END IF;
      END
      $$
    `);

    await queryRunner.query(`
      UPDATE "order"
      SET "paymentMethodSelected" = "paymentMethod"
      WHERE "paymentMethodSelected" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "order_status_enum_old" AS ENUM (
        'PENDING',
        'PAID',
        'SOLD',
        'CANCELLED'
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
          WHEN 'PENDING_VALIDATION' THEN 'PENDING'
          WHEN 'VALIDATED' THEN 'PENDING'
          WHEN 'AWAITING_PAYMENT' THEN 'PENDING'
          WHEN 'PAID' THEN 'PAID'
          WHEN 'SALE_CREATED' THEN 'SOLD'
          WHEN 'SHIPPED' THEN 'SOLD'
          WHEN 'DELIVERED' THEN 'SOLD'
          WHEN 'CANCELLED' THEN 'CANCELLED'
          WHEN 'EXPIRED' THEN 'CANCELLED'
          ELSE 'PENDING'
        END
      )::"order_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "sales"
      ALTER COLUMN "orderStatusBeforeSale" TYPE "order_status_enum"
      USING (
        CASE "orderStatusBeforeSale"
          WHEN 'PENDING_VALIDATION' THEN 'PENDING'
          WHEN 'VALIDATED' THEN 'PENDING'
          WHEN 'AWAITING_PAYMENT' THEN 'PENDING'
          WHEN 'PAID' THEN 'PAID'
          WHEN 'SALE_CREATED' THEN 'SOLD'
          WHEN 'SHIPPED' THEN 'SOLD'
          WHEN 'DELIVERED' THEN 'SOLD'
          WHEN 'CANCELLED' THEN 'CANCELLED'
          WHEN 'EXPIRED' THEN 'CANCELLED'
          ELSE NULL
        END
      )::"order_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      ALTER COLUMN "status" SET DEFAULT 'PENDING'
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      DROP COLUMN IF EXISTS "paymentMethodSelected"
    `);

    await queryRunner.query(`
      ALTER TABLE "order"
      DROP COLUMN IF EXISTS "statusHistory"
    `);
  }
}
