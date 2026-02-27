# Inventory Module

## Overview

The `Inventory` module manages product stock with transactional guarantees and role-protected admin endpoints.

Implemented stack:
- NestJS + TypeORM
- PostgreSQL constraints and indexes
- JWT + RBAC (`admin` role)
- Swagger documentation via decorators

---

## Business Rules

1. Each product can have zero or one inventory record (`UNIQUE(productId)`).
2. Stock can never be negative (`quantity >= 0` DB check + service validation).
3. Order creation decreases stock in a single DB transaction.
4. If stock is insufficient, API throws `BadRequestException` (HTTP 400).
5. Only admins can query/adjust inventory.
6. Inventory listing must include all active products, even without inventory row.

---

## Entity Design

`src/inventory/entities/inventory.entity.ts`

Fields:
- `id` (uuid, PK)
- `productId` (int, unique, indexed)
- `quantity` (int, default 0)
- `reservedQuantity` (int, default 0)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

Constraints and indexes:
- `CHECK (quantity >= 0)`
- `CHECK (reservedQuantity >= 0)`
- `UNIQUE INDEX(productId)`
- `INDEX(quantity)`

Relationship:
- `OneToOne` with `Product` (`onDelete: CASCADE`)

---

## API Endpoints (Admin Only)

All endpoints require:
- `Authorization: Bearer <token>`
- `JwtAuthGuard`
- `RolesGuard`
- `@Roles(AdminRole.ADMIN)`

### GET `/inventory`
Paginated listing based on products (not only inventory rows).

Behavior:
- Returns all active, non-archived products.
- Uses `LEFT JOIN` with inventory.
- If inventory row does not exist, quantity is returned as `0` and timestamps as `null`.

Query params:
- `page` (default `1`)
- `limit` (default `10`, max `100`)
- `productName` (case-insensitive partial match)
- `lowStock` (`true/false`)
- `lowStockThreshold` (default `10`)
- `sortBy` (`quantity | createdAt | updatedAt | productName`)
- `sortOrder` (`ASC | DESC`)

Response:
- `PaginatedInventoryResponseDto`

### GET `/inventory/:productId`
Returns inventory by product id.

Behavior:
- If product exists but inventory row does not, returns virtual inventory view with `quantity = 0`.
- If product does not exist (or is archived), returns `404`.

Response:
- `InventoryResponseDto`

### PATCH `/inventory/:productId/adjust`
Adjusts stock up or down.

Body:
```json
{
  "adjustment": -5
}
```

Rules:
- Positive values increase stock
- Negative values decrease stock
- Resulting quantity must remain `>= 0`
- If inventory row does not exist and adjustment is positive, row is auto-created with base quantity `0`
- Operation executes in a DB transaction

Response:
- `InventoryResponseDto`

---

## DTOs

- `AdjustStockDto`
- `GetInventoryQueryDto`
- `InventoryResponseDto`
- `PaginatedInventoryResponseDto`

---

## Transaction and Concurrency Strategy

Service methods:
- `findAll()`
- `findByProductId()`
- `adjustStock()`
- `decreaseStock(productId, quantity, manager?)`
- `increaseStock(productId, quantity, manager?)`

Concurrency handling:
- Uses `pessimistic_write` lock for stock mutation queries.
- Uses deterministic lock order in order creation flow (sorted product IDs) to reduce deadlock probability.

Listing strategy:
- Product-driven query with `LEFT JOIN inventory` and `COALESCE(inventory.quantity, 0)`.
- Pagination metadata (`total`, `page`, `limit`, `totalPages`) is calculated over products.

Overflow protection:
- Rejects quantities above PostgreSQL `int4` max (`2147483647`).

---

## Orders Integration

`OrdersService.create()` now runs fully inside `dataSource.transaction(...)`.

Flow:
1. Aggregate quantities per product from order items.
2. Decrease stock per product inside same transaction.
3. Build and persist order + order items.
4. Any inventory error causes full rollback.

Outcome:
- No partial order writes
- No negative stock
- Safe behavior under concurrent requests

---

## Swagger

Inventory endpoints are documented under tag:
- `Inventory`

Documentation includes:
- Bearer auth requirement
- Query params
- Request body (`AdjustStockDto`)
- Success and error responses (`400/401/403/404`)

Swagger UI:
- `GET /docs`
