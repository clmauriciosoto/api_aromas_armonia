import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesLedger1762000000000 implements MigrationInterface {
  name = 'CreateSalesLedger1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'sale_type_enum'
        ) THEN
          CREATE TYPE "sale_type_enum" AS ENUM ('LOCAL', 'ORDER');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'sale_status_enum'
        ) THEN
          CREATE TYPE "sale_status_enum" AS ENUM ('COMPLETED', 'CANCELLED');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'inventory_movement_type_enum'
        ) THEN
          CREATE TYPE "inventory_movement_type_enum" AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT', 'SALE_REVERSAL');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "sale_type_enum" NOT NULL,
        "status" "sale_status_enum" NOT NULL DEFAULT 'COMPLETED',
        "orderId" integer,
        "customerName" character varying,
        "customerEmail" character varying,
        "totalAmount" integer NOT NULL,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sales_order" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_sales_created_by" FOREIGN KEY ("createdBy") REFERENCES "admins"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sales_createdAt" ON "sales" ("createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sales_status" ON "sales" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sales_type" ON "sales" ("type")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sale_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "saleId" uuid NOT NULL,
        "productId" integer NOT NULL,
        "productName" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" integer NOT NULL,
        "subtotal" integer NOT NULL,
        CONSTRAINT "PK_sale_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sale_items_sale" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sale_items_product" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sale_items_saleId" ON "sale_items" ("saleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sale_items_productId" ON "sale_items" ("productId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" integer NOT NULL,
        "type" "inventory_movement_type_enum" NOT NULL,
        "quantityChange" integer NOT NULL,
        "previousQuantity" integer NOT NULL,
        "newQuantity" integer NOT NULL,
        "saleId" uuid,
        "note" character varying,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_movements_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_inventory_movements_product" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_inventory_movements_sale" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_inventory_movements_created_by" FOREIGN KEY ("createdBy") REFERENCES "admins"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_productId" ON "inventory_movements" ("productId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_saleId" ON "inventory_movements" ("saleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_type" ON "inventory_movements" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_createdAt" ON "inventory_movements" ("createdAt")`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'order_status_enum' AND e.enumlabel = 'SOLD'
        ) THEN
          NULL;
        ELSE
          ALTER TYPE "order_status_enum" ADD VALUE 'SOLD';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_inventory_movements_createdAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_inventory_movements_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_inventory_movements_saleId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_inventory_movements_productId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_movements"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sale_items_productId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sale_items_saleId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_items"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_createdAt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);

    await queryRunner.query(
      `DROP TYPE IF EXISTS "inventory_movement_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "sale_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sale_type_enum"`);
  }
}
