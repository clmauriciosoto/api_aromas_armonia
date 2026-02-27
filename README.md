# Aromas Armonia API

API backend de ecommerce construido con NestJS, TypeORM y PostgreSQL.

## Stack

- NestJS
- TypeORM
- PostgreSQL
- JWT + RBAC (admin/user)
- Swagger/OpenAPI

## Módulos principales

- `auth`
- `users`
- `products`
- `attributes`
- `orders`
- `inventory`
- `newsletters`

## Ejecución

```bash
npm install
npm run start:dev
```

Aplicación:
- `http://localhost:3000`

Swagger UI:
- `http://localhost:3000/docs`

## Inventario (nuevo)

Endpoints admin:

- `GET /inventory` (paginación, filtros y sorting)
- `GET /inventory/:productId` (detalle de stock)
- `PATCH /inventory/:productId/adjust` (ajuste manual de stock)

Reglas de stock:

- No se permite stock negativo
- Validación ante overflow de `int4`
- Locks pesimistas (`pessimistic_write`) en mutaciones

## Integración Orders + Inventory

La creación de órdenes se ejecuta en una transacción única:

1. Valida y descuenta stock por producto.
2. Crea orden e ítems.
3. Si falla cualquier validación de stock, se hace rollback completo.

## Documentación adicional

- `QUICK_START.md`
- `AUTH_README.md`
- `AUTH_MODULE.md`
- `INVENTORY_MODULE.md`
- `SETUP_AUTH.md`
- `FILES_SUMMARY.md`
