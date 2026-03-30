import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderItemStateAndHistory1762600000000
  implements MigrationInterface
{
  name = 'OrderItemStateAndHistory1762600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'order_item_status_enum'
        ) THEN
          CREATE TYPE "order_item_status_enum" AS ENUM ('ACTIVE', 'REMOVED');
        END IF;
      END
      $$
    `);

    await queryRunner.query(`
      ALTER TABLE "order_item"
      ADD COLUMN IF NOT EXISTS "status" "order_item_status_enum" NOT NULL DEFAULT 'ACTIVE'
    `);

    await queryRunner.query(`
      ALTER TABLE "order_item"
      ADD COLUMN IF NOT EXISTS "changeHistory" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      UPDATE "order_item"
      SET "changeHistory" = jsonb_build_array(
        jsonb_build_object(
          'action', 'CREATED',
          'changedAt', NOW(),
          'note', 'Initial history migrated',
          'newQuantity', "quantity"
        )
      )
      WHERE "changeHistory" IS NULL
         OR jsonb_typeof("changeHistory") <> 'array'
         OR jsonb_array_length("changeHistory") = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_item"
      DROP COLUMN IF EXISTS "changeHistory"
    `);

    await queryRunner.query(`
      ALTER TABLE "order_item"
      DROP COLUMN IF EXISTS "status"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "order_item_status_enum"
    `);
  }
}
