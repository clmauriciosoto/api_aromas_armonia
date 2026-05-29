import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductRelations1762900000000
  implements MigrationInterface
{
  name = 'CreateProductRelations1762900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "product_relations_relationtype_enum" AS ENUM (
        'ACCESSORY',
        'RECOMMENDED',
        'ALSO_INTERESTING',
        'REFILL'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product_relations" (
        "id" SERIAL NOT NULL,
        "sourceProductId" integer NOT NULL,
        "targetProductId" integer NOT NULL,
        "relationType" "product_relations_relationtype_enum" NOT NULL,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_product_relation_distinct_products" CHECK ("sourceProductId" <> "targetProductId"),
        CONSTRAINT "UQ_product_relation_source_target_type" UNIQUE ("sourceProductId", "targetProductId", "relationType"),
        CONSTRAINT "PK_product_relations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_relations_source" FOREIGN KEY ("sourceProductId") REFERENCES "product"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_relations_target" FOREIGN KEY ("targetProductId") REFERENCES "product"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_relation_source" ON "product_relations" ("sourceProductId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_relation_target" ON "product_relations" ("targetProductId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_relation_type" ON "product_relations" ("relationType")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_relation_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_relation_target"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_relation_source"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_relations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "product_relations_relationtype_enum"`);
  }
}