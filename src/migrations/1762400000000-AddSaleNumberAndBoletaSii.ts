import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleNumberAndBoletaSii1762400000000
  implements MigrationInterface
{
  name = 'AddSaleNumberAndBoletaSii1762400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Secuencia para el número de venta correlativo
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS "sales_sale_number_seq"
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1
    `);

    // saleNumber: correlativo autogenerado por la secuencia
    await queryRunner.query(`
      ALTER TABLE "sales"
        ADD COLUMN IF NOT EXISTS "saleNumber" integer
          NOT NULL
          DEFAULT nextval('sales_sale_number_seq')
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sales_saleNumber"
        ON "sales" ("saleNumber")
    `);

    // documentNumber: único, no secuencial, opcional
    await queryRunner.query(`
      ALTER TABLE "sales"
        ADD COLUMN IF NOT EXISTS "documentNumber" integer
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sales_documentNumber_not_null"
        ON "sales" ("documentNumber")
        WHERE "documentNumber" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_sales_documentNumber_not_null"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "documentNumber"`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sales_saleNumber"`);
    await queryRunner.query(
      `ALTER TABLE "sales" DROP COLUMN IF EXISTS "saleNumber"`,
    );

    await queryRunner.query(`DROP SEQUENCE IF EXISTS "sales_sale_number_seq"`);
  }
}
