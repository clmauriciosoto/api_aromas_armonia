import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryBatchMovements1762300000000
  implements MigrationInterface
{
  name = 'CreateInventoryBatchMovements1762300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'inventory_batch_movement_type_enum'
        ) THEN
          CREATE TYPE "inventory_batch_movement_type_enum" AS ENUM ('IN', 'OUT');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_batch_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "inventory_batch_movement_type_enum" NOT NULL,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_batch_movements_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_inventory_batch_movements_created_by" FOREIGN KEY ("createdBy") REFERENCES "admins"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_batch_movements_type" ON "inventory_batch_movements" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_batch_movements_createdAt" ON "inventory_batch_movements" ("createdAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_batch_movement_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "movementId" uuid NOT NULL,
        "productId" integer NOT NULL,
        "quantity" integer NOT NULL,
        CONSTRAINT "PK_inventory_batch_movement_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_INVENTORY_BATCH_ITEM_QUANTITY_POSITIVE" CHECK ("quantity" > 0),
        CONSTRAINT "FK_inventory_batch_movement_items_movement" FOREIGN KEY ("movementId") REFERENCES "inventory_batch_movements"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_inventory_batch_movement_items_product" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_batch_movement_items_movementId" ON "inventory_batch_movement_items" ("movementId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_batch_movement_items_productId" ON "inventory_batch_movement_items" ("productId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_inventory_batch_movement_items_productId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_inventory_batch_movement_items_movementId"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "inventory_batch_movement_items"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_inventory_batch_movements_createdAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_inventory_batch_movements_type"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_batch_movements"`);

    await queryRunner.query(
      `DROP TYPE IF EXISTS "inventory_batch_movement_type_enum"`,
    );
  }
}
