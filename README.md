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

## Flags de carrito y checkout

Endpoints para controlar disponibilidad desde frontend y administración:

- `GET /orders/availability` (público: estado de `cartEnabled` y `checkoutEnabled`)
- `GET /admin/orders/settings` (admin: consulta flags actuales)
- `PATCH /admin/orders/settings` (admin: actualiza flags)

Si `checkoutEnabled=false`, `POST /orders` responde `403` y bloquea confirmar pedido.

## Documentación adicional

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

- `QUICK_START.md`
- `AUTH_README.md`
- `AUTH_MODULE.md`
- `INVENTORY_MODULE.md`
- `SETUP_AUTH.md`
- `FILES_SUMMARY.md`

## Versionado automático

Este repositorio usa **Conventional Commits + Semantic Release** para automatizar versiones y releases en GitHub al hacer push a `main`.

Flujo automático en `main`:

- Analiza commits convencionales
- Calcula si el release es `major`, `minor` o `patch`
- Incrementa versión en `package.json`
- Crea tag `vX.X.X`
- Actualiza `CHANGELOG.md`
- Crea commit `chore(release): X.X.X`
- Publica release en GitHub

### Ejemplos de commits válidos

```bash
feat: agregar subida de imagen
fix: corregir error en login
docs: actualizar documentación
refactor: mejorar servicio de usuarios
feat!: cambiar contrato de API
```

Más ejemplos:

```bash
feat: agregar subida de pdf
fix: corregir validación de archivo
```


