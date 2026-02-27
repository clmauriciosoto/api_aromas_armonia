import { MigrationInterface, QueryRunner } from 'typeorm';

export class SalesOrderIntegrity1762005000000 implements MigrationInterface {
  name = 'SalesOrderIntegrity1762005000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD COLUMN IF NOT EXISTS "orderStatusBeforeSale" "order_status_enum"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sales_orderId_not_null"
      ON "sales" ("orderId")
      WHERE "orderId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_sales_orderId_not_null"`,
    );

    await queryRunner.query(`
      ALTER TABLE "sales"
      DROP COLUMN IF EXISTS "orderStatusBeforeSale"
    `);
  }
}
