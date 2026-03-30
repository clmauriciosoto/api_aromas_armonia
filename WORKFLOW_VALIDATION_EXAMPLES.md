// ============================================================================
// FLUJO DE VALIDACIÓN Y AJUSTE DE ÓRDENES - EJEMPLOS DE USO
// ============================================================================

// Este documento muestra cómo el administrador puede validar el stock de una
// orden y ajustar items antes de proceder al pago.

// ============================================================================
// 1. FLUJO PRINCIPAL: VALIDAR ORDEN
// ============================================================================

// ENDPOINT: POST /admin/orders/{orderId}/validate
// DESCRIPCIÓN: Obtiene información de stock disponible vs solicitado

// REQUEST:
POST /admin/orders/1/validate

// RESPONSE 200:
{
  "orderId": 1,
  "orderStatus": "PENDING_VALIDATION",
  "totalAmount": 39975,
  "items": [
    {
      "id": 1,
      "productId": 12,
      "productName": "Elegance Noir",
      "quantityRequested": 5,
      "quantityAvailable": 12,
      "isAvailable": true,
      "warning": null,
      "unitPrice": 7995,
      "subtotal": 39975
    },
    {
      "id": 2,
      "productId": 25,
      "productName": "Mystic Rose",
      "quantityRequested": 3,
      "quantityAvailable": 1,  // ⚠️ INSUFICIENTE
      "isAvailable": false,
      "warning": "Stock insuficiente. Solicitados: 3, Disponibles: 1",
      "unitPrice": 5500,
      "subtotal": 16500
    }
  ],
  "allItemsAvailable": false,
  "itemsWithWarnings": 1,
  "summary": "Hay 1 producto(s) con stock insuficiente. Ajusta la orden antes de continuar.",
  "suggestedActions": [
    "Omitir productos con stock insuficiente",
    "Reducir cantidades",
    "Reemplazar por otro producto"
  ]
}

// ============================================================================
// 2. OPCIÓN A: OMITIR UN PRODUCTO
// ============================================================================

// ENDPOINT: PATCH /admin/orders/{orderId}/adjust
// DESCRIPCIÓN: Quitar un producto de la orden

// REQUEST:
PATCH /admin/orders/1/adjust
Content-Type: application/json

{
  "adjustments": [
    {
      "removeItemId": 2  // Remover el item con "Mystic Rose"
    }
  ]
}

// RESPONSE 200: (Validación actualizada sin el producto)
{
  "orderId": 1,
  "orderStatus": "PENDING_VALIDATION",
  "totalAmount": 39975,  // Solo el primer producto
  "items": [
    {
      "id": 1,
      "productId": 12,
      "productName": "Elegance Noir",
      "quantityRequested": 5,
      "quantityAvailable": 12,
      "isAvailable": true,
      "warning": null,
      "unitPrice": 7995,
      "subtotal": 39975
    }
    // Mystic Rose fue removido
  ],
  "allItemsAvailable": true,
  "itemsWithWarnings": 0,
  "summary": "Todos los productos están disponibles. La orden puede proceder a pago.",
  "suggestedActions": []
}

// ============================================================================
// 3. OPCIÓN B: REDUCIR CANTIDAD
// ============================================================================

// ENDPOINT: PATCH /admin/orders/{orderId}/adjust
// DESCRIPCIÓN: Cambiar la cantidad de un producto

// REQUEST:
PATCH /admin/orders/1/adjust
Content-Type: application/json

{
  "adjustments": [
    {
      "itemIdToAdjust": 2,
      "newQuantity": 1  // Reducir de 3 a 1 (ahora sí hay stock)
    }
  ]
}

// RESPONSE 200:
{
  "orderId": 1,
  "orderStatus": "PENDING_VALIDATION",
  "totalAmount": 56475,  // 39975 (Elegance) + 5500 (Mystic Rose x1)
  "items": [
    {
      "id": 1,
      "productId": 12,
      "productName": "Elegance Noir",
      "quantityRequested": 5,
      "quantityAvailable": 12,
      "isAvailable": true,
      "warning": null,
      "unitPrice": 7995,
      "subtotal": 39975
    },
    {
      "id": 2,
      "productId": 25,
      "productName": "Mystic Rose",
      "quantityRequested": 1,  // ✅ AJUSTADO
      "quantityAvailable": 1,
      "isAvailable": true,
      "warning": null,
      "unitPrice": 5500,
      "subtotal": 5500
    }
  ],
  "allItemsAvailable": true,
  "itemsWithWarnings": 0,
  "summary": "Todos los productos están disponibles. La orden puede proceder a pago.",
  "suggestedActions": []
}

// ============================================================================
// 4. OPCIÓN C: REEMPLAZAR UN PRODUCTO
// ============================================================================

// ENDPOINT: PATCH /admin/orders/{orderId}/adjust
// DESCRIPCIÓN: Cambiar un producto por otro en la orden

// REQUEST:
PATCH /admin/orders/1/adjust
Content-Type: application/json

{
  "adjustments": [
    {
      "itemIdToReplace": 2,          // Quitar Mystic Rose
      "replacementProductId": 35,    // Reemplazar con "Lavender Dream"
      "replacementQuantity": 2       // Con cantidad 2 (opcional, si no se pone usa la original)
    }
  ]
}

// RESPONSE 200:
{
  "orderId": 1,
  "orderStatus": "PENDING_VALIDATION",
  "totalAmount": 59975,  // 39975 (Elegance) + 6500 x 2 (Lavender Dream)
  "items": [
    {
      "id": 1,
      "productId": 12,
      "productName": "Elegance Noir",
      "quantityRequested": 5,
      "quantityAvailable": 12,
      "isAvailable": true,
      "warning": null,
      "unitPrice": 7995,
      "subtotal": 39975
    },
    {
      "id": 2,  // Mismo item pero con nuevo producto
      "productId": 35,  // ✅ CAMBIADO A LAVENDER DREAM
      "productName": "Lavender Dream",
      "quantityRequested": 2,
      "quantityAvailable": 8,
      "isAvailable": true,
      "warning": null,
      "unitPrice": 6500,
      "subtotal": 13000
    }
  ],
  "allItemsAvailable": true,
  "itemsWithWarnings": 0,
  "summary": "Todos los productos están disponibles. La orden puede proceder a pago.",
  "suggestedActions": []
}

// ============================================================================
// 5. AJUSTES MÚLTIPLES EN UNA SOLA LLAMADA
// ============================================================================

// ENDPOINT: PATCH /admin/orders/{orderId}/adjust
// DESCRIPCIÓN: Combinar múltiples ajustes en una sola petición

// REQUEST:
PATCH /admin/orders/2/adjust
Content-Type: application/json

{
  "adjustments": [
    {
      "removeItemId": 3    // Eliminar item 3
    },
    {
      "itemIdToAdjust": 4,
      "newQuantity": 2     // Reducir item 4 cantidad
    },
    {
      "itemIdToReplace": 5,
      "replacementProductId": 40  // Reemplazar item 5
    }
  ]
}

// RESPONSE 200: (Validación actualizada con todos los cambios)
// Se aplican todos los ajustes y se retorna la validación final

// ============================================================================
// 6. CONFIRMAR VALIDACIÓN Y PASAR A SIGUIENTE ESTADO
// ============================================================================

// ENDPOINT: POST /admin/orders/{orderId}/confirm-validation
// DESCRIPCIÓN: Una vez que el admin confirma los ajustes correctos,
//              la orden pasa de PENDING_VALIDATION a VALIDATED

// REQUEST:
POST /admin/orders/1/confirm-validation

// RESPONSE 200:
{
  "id": 1,
  "status": "VALIDATED",  // ✅ CAMBIO DE ESTADO
  "statusHistory": [
    {
      "from": null,
      "to": "PENDING_VALIDATION",
      "changedAt": "2026-03-29T10:00:00.000Z",
      "note": "Order created"
    },
    {
      "from": "PENDING_VALIDATION",
      "to": "VALIDATED",
      "changedAt": "2026-03-29T10:15:00.000Z",
      "note": "Order items validated and quantities confirmed"
    }
  ],
  "statusHistory": [...],
  "paymentMethodSelected": "BANK_TRANSFER",
  "totalAmount": 39975,
  "createdAt": "2026-03-29T10:00:00.000Z",
  "updatedAt": "2026-03-29T10:15:00.000Z",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "phone": "+56987654321",
  "address": "Calle Principal 123, Santiago",
  "paymentMethod": "BANK_TRANSFER",
  "items": [...]
}

// ============================================================================
// 7. FLUJO COMPLETO EN SECUENCIA
// ============================================================================

/*
PASO 1: Admin recibe una orden PENDING_VALIDATION
================================================================================
GET /admin/orders/1
→ Orden en estado PENDING_VALIDATION

PASO 2: Admin solicita validar stock
================================================================================
POST /admin/orders/1/validate
→ Respuesta muestra:
  - Cantidad solicitada vs disponible
  - Items con problemas de stock
  - Sugerencias de acciones

PASO 3: Admin ajusta la orden (puede hacer múltiples ajustes)
================================================================================
PATCH /admin/orders/1/adjust
{
  "adjustments": [
    { "removeItemId": 5 },
    { "itemIdToAdjust": 3, "newQuantity": 2 }
  ]
}
→ Respuesta muestra validación actualizada

PASO 4: Admin valida nuevamente para confirmar que está OK
================================================================================
POST /admin/orders/1/validate
→ Todos los items now show isAvailable: true
→ summary: "Todos los productos están disponibles..."

PASO 5: Admin confirma validación
================================================================================
POST /admin/orders/1/confirm-validation
→ Orden pasa a VALIDATED
→ statusHistory se actualiza

PASO 6: Admin puede proceder a solicitar pago
================================================================================
El sistema puede ahora hacer POST /orders/1/request-payment
→ Orden pasa a AWAITING_PAYMENT
→ Cliente recibe solicitud de pago
*/

// ============================================================================
// 8. CASOS DE ERROR
// ============================================================================

// ERROR: Intentar ajustar item inexistente
PATCH /admin/orders/1/adjust
{
  "adjustments": [
    { "itemIdToAdjust": 999, "newQuantity": 1 }
  ]
}

// RESPONSE 404:
{
  "statusCode": 404,
  "message": "Order item with id 999 not found",
  "error": "Not Found"
}

// ERROR: Intentar reemplazar con producto inexistente
PATCH /admin/orders/1/adjust
{
  "adjustments": [
    { "itemIdToReplace": 2, "replacementProductId": 9999 }
  ]
}

// RESPONSE 404:
{
  "statusCode": 404,
  "message": "Product with id 9999 not found",
  "error": "Not Found"
}

// ERROR: Intentar confirmar orden sin items
POST /admin/orders/1/confirm-validation

// RESPONSE 400:
{
  "statusCode": 400,
  "message": "Order must have at least one item to be validated",
  "error": "Bad Request"
}

// ============================================================================
// 9. RESUMEN VISUAL DEL FLUJO DE ESTADOS
// ============================================================================

/*
┌──────────────────────┐
│ PENDING_VALIDATION   │  ← Orden creada
│ (Admin valida stock) │
└──────────────┬───────┘
               │
        ┌──────┴─────────────────────────┐
        │   Admin ajusta items           │
        │ (omitir/reducir/reemplazar)    │
        └──────┬─────────────────────────┘
               │
        ┌──────┴──────────────────────────────────┐
        │ Si hay problemas: PATCH /adjust         │
        │ Si todo OK: Confirma validación        │
        └──────┬──────────────────────────────────┘
               │
        ┌──────▼──────────┐
        │  VALIDATED      │  ← Listo para pago
        └─────────────────┘
               │
        ┌──────▼──────────────────┐
        │ AWAITING_PAYMENT        │  (siguiente paso)
        └─────────────────────────┘
*/

// ============================================================================
