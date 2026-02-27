import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const dbHost = getRequiredEnv('DATABASE_HOST');
const dbUser = getRequiredEnv('DATABASE_USER');
const dbName = getRequiredEnv('DATABASE_NAME');
const dbPassword = process.env.DATABASE_PASSWORD ?? '';
const dbPort = Number.parseInt(process.env.DATABASE_PORT ?? '5432', 10);

if (!Number.isInteger(dbPort) || dbPort <= 0) {
  throw new Error('DATABASE_PORT must be a valid positive integer');
}

const dataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: dbPort,
  username: dbUser,
  password: dbPassword,
  database: dbName,
});

async function backfill(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      await manager.query(`
        UPDATE "product"
        SET
          "price" = COALESCE("price", 0),
          "currency" = COALESCE("currency", 'CLP'),
          "status" = COALESCE("status", 'ACTIVE'::"public"."product_status_enum"),
          "isPurchasable" = COALESCE("isPurchasable", true)
      `);

      await manager.query(`
        WITH base AS (
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
          AND (p."slug" IS NULL OR p."slug" = '')
      `);
    });

    console.log('Product data backfill completed successfully.');
  } finally {
    await dataSource.destroy();
  }
}

void backfill();
