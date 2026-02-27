import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductCentColumns1761910000000
  implements MigrationInterface
{
  name = 'DropProductCentColumns1761910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN IF EXISTS "priceInCents"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN IF EXISTS "discountInCents"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "priceInCents" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "discountInCents" integer`,
    );

    await queryRunner.query(
      `UPDATE "product"
       SET
         "priceInCents" = COALESCE("priceInCents", "price", 0),
         "discountInCents" = COALESCE("discountInCents", "discountPrice")`,
    );
  }
}
