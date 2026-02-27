import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductEnterpriseRefactor1761900000000
  implements MigrationInterface
{
  name = 'ProductEnterpriseRefactor1761900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."product_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    );

    await queryRunner.query(
      `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "slug" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "status" "public"."product_status_enum" DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "isPurchasable" boolean DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "currency" character varying(3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP`,
    );

    await queryRunner.query(
      `UPDATE "product"
       SET
         "price" = COALESCE("price", 0),
         "currency" = COALESCE("currency", 'CLP'),
         "status" = COALESCE("status", 'ACTIVE'::"public"."product_status_enum"),
         "isPurchasable" = COALESCE("isPurchasable", true);`,
    );

    await queryRunner.query(
      `WITH base AS (
          SELECT
            id,
            COALESCE(NULLIF(regexp_replace(lower(trim(name)), '[^a-z0-9\\s-]', '', 'g'), ''), 'product') AS base_slug
          FROM "product"
        ),
        numbered AS (
          SELECT
            id,
            base_slug,
            row_number() OVER (PARTITION BY base_slug ORDER BY id) AS rn
          FROM base
        )
        UPDATE "product" p
        SET "slug" = CASE
          WHEN n.rn = 1 THEN n.base_slug
          ELSE n.base_slug || '-' || n.rn
        END
        FROM numbered n
        WHERE p.id = n.id
          AND (p."slug" IS NULL OR p."slug" = '');`,
    );

    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "currency" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "slug" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_slug_unique" ON "product" ("slug")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "product_images" (
        "id" SERIAL NOT NULL,
        "productId" integer NOT NULL,
        "url" character varying NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "isPrimary" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_product_images_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `DO $$ BEGIN
        ALTER TABLE "product_images"
        ADD CONSTRAINT "FK_product_images_product"
        FOREIGN KEY ("productId")
        REFERENCES "product"("id")
        ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_images_product_id" ON "product_images" ("productId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_product_images_product_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "product_images"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_slug_unique"`);

    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN IF EXISTS "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN IF EXISTS "currency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN IF EXISTS "isPurchasable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN IF EXISTS "slug"`,
    );

    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."product_status_enum"`,
    );
  }
}
