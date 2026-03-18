import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductBarcode1762200000000 implements MigrationInterface {
  name = 'AddProductBarcode1762200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "barcode" character varying',
    );

    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_barcode_unique" ON "product" ("barcode")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_product_barcode_unique"');
    await queryRunner.query(
      'ALTER TABLE "product" DROP COLUMN IF EXISTS "barcode"',
    );
  }
}
