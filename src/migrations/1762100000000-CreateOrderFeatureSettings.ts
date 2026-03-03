import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderFeatureSettings1762100000000
  implements MigrationInterface
{
  name = 'CreateOrderFeatureSettings1762100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_feature_settings" (
        "id" integer NOT NULL,
        "cartEnabled" boolean NOT NULL DEFAULT true,
        "checkoutEnabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_feature_settings_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "order_feature_settings" ("id", "cartEnabled", "checkoutEnabled")
      VALUES (1, true, true)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "order_feature_settings"`);
  }
}
