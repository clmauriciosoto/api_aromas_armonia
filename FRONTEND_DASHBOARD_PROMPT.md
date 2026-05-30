Objetivo
Implementar un dashboard administrativo completo consumiendo la API existente del backend de Aromas Armonia.

Contexto técnico
- Backend NestJS con JWT Bearer y rol admin.
- Todas las rutas de dashboard están bajo /admin/dashboard.
- El dashboard debe ser operativo, no solo visual: incluir KPIs, tendencias, colas accionables y alertas.

Requisitos de autenticación
- Incluir Authorization: Bearer <token> en cada request.
- Si la API responde 401 o 403, redirigir a login admin o mostrar pantalla de acceso denegado.

Rutas backend disponibles
1) Ventas
- GET /admin/dashboard/sales/overview
  Query opcional: startDate, endDate (ISO 8601)
- GET /admin/dashboard/sales/timeseries
  Query opcional: startDate, endDate, granularity (day | month)

2) Ordenes
- GET /admin/dashboard/orders/overview
  Query opcional: startDate, endDate
- GET /admin/dashboard/orders/funnel
  Query opcional: startDate, endDate
- GET /admin/dashboard/orders/actionable
  Query opcional: limit
- GET /admin/dashboard/orders/waiting-stock
  Query opcional: limit

3) Inventario
- GET /admin/dashboard/inventory/overview
  Query opcional: lowStockThreshold
- GET /admin/dashboard/inventory/low-stock
  Query opcional: lowStockThreshold, limit

4) Productos
- GET /admin/dashboard/products/overview
- GET /admin/dashboard/products/top-selling
  Query opcional: startDate, endDate, limit

5) Alertas
- GET /admin/dashboard/alerts
  Query opcional: startDate, endDate, lowStockThreshold, limit

Diseño de la pantalla principal
Construir una sola vista de dashboard con estas secciones:

A. Barra de filtros globales
- Rango de fecha (presets 7d, 30d, 90d, 12m + rango personalizado).
- Granularidad para grafico de ventas (day/month).
- Umbral de stock bajo.
- Boton refrescar.

B. Fila de KPIs principales
- Ventas: totalSalesAmount, totalSalesCount, averageTicket.
- Ordenes: totalOrders, pendingValidationCount, waitingStockCount.
- Inventario: outOfStockCount, lowStockCount.
- Mostrar variaciones contra periodo anterior usando los campos de comparacion cuando existan.

C. Grafico principal
- Serie temporal de ventas (salesAmount) con selector day/month.
- Tooltip con salesAmount, salesCount, itemsSold por bucket.

D. Bloque de operaciones (accionable)
- Tabla de orders/actionable ordenada por antiguedad.
- Tabla de orders/waiting-stock mostrando faltantes por item (shortage).
- Tabla de inventory/low-stock con availableToSell y orden ascendente por stock.

E. Inteligencia comercial
- Tabla o grafico de products/top-selling con unitsSold, revenue y currentStock.

F. Alertas
- Tarjetas para pendingValidationOrders, waitingStockOrders, cancelledSalesCount.
- Lista de outOfStockProducts y lowStockProducts.

Requisitos de UX
- Mostrar skeletons durante carga inicial.
- Soportar carga parcial: si falla una seccion, no bloquear todo el dashboard.
- Mostrar estados vacios claros (sin datos en el rango seleccionado).
- Mostrar ultimo update (timestamp local) por seccion.
- Evitar requests innecesarios: debounce en filtros y cache corto por query key.

Requisitos de arquitectura frontend
- Separar capa de API, hooks y componentes de presentacion.
- Usar tipado estricto de respuestas.
- Implementar manejo de errores por endpoint con retry manual.
- Mantener estado de filtros en URL para compartir vista.

Contrato de trabajo esperado
1) Crear cliente API de dashboard con funciones por endpoint.
2) Crear tipos para cada respuesta y query.
3) Implementar hooks de datos por seccion.
4) Implementar layout del dashboard con componentes reutilizables.
5) Integrar filtros globales y refresco.
6) Implementar estados loading/error/empty por widget.
7) Entregar checklist de QA manual.

Checklist QA minimo
- Cambiar rango de fechas actualiza ventas, ordenes, top-selling y alertas.
- Cambiar granularidad modifica el grafico sin romper datos.
- Cambiar lowStockThreshold actualiza overview, low-stock y alertas.
- Pantalla se recupera correctamente ante error de un endpoint aislado.
- Sin token valido, no se muestran datos protegidos.

Entregables
- Vista dashboard funcional en desktop y mobile.
- Tipos y servicios API mantenibles.
- Documentacion corta de como agregar un nuevo widget conectado a /admin/dashboard.