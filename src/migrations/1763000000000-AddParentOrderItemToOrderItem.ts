import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentOrderItemToOrderItem1763000000000
  implements MigrationInterface
{
  name = 'AddParentOrderItemToOrderItem1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_item"
      ADD COLUMN IF NOT EXISTS "parentOrderItemId" integer NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_order_item_parent_order_item" ON "order_item" ("parentOrderItemId")
    `);

    await queryRunner.query(`
      ALTER TABLE "order_item"
      ADD CONSTRAINT "FK_order_item_parent_order_item"
      FOREIGN KEY ("parentOrderItemId") REFERENCES "order_item"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_item"
      DROP CONSTRAINT IF EXISTS "FK_order_item_parent_order_item"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_order_item_parent_order_item"
    `);

    await queryRunner.query(`
      ALTER TABLE "order_item"
      DROP COLUMN IF EXISTS "parentOrderItemId"
    `);
  }
}