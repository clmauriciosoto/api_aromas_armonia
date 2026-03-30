## [1.11.0](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.10.0...v1.11.0) (2026-03-30)

### Features

* enhance order workflow with validation and adjustment capabilities ([077c3e6](https://github.com/clmauriciosoto/api_aromas_armonia/commit/077c3e6d276417131d99fc7d0e2626ceb111b741))

## [1.10.0](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.9.0...v1.10.0) (2026-03-27)

### Features

* add saleNumber and documentNumber fields to sales entity, DTOs, and service methods; implement update functionality in controller ([5a88a34](https://github.com/clmauriciosoto/api_aromas_armonia/commit/5a88a3489309a270951e2c756a71c0e9014a5d22))

## [1.9.0](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.8.0...v1.9.0) (2026-03-25)

### Features

* update inventory movement response DTO to include sales prefix and adjust related service and controller references ([49d40ec](https://github.com/clmauriciosoto/api_aromas_armonia/commit/49d40ece0f43a214041dd7e7ab82c71c957f3ca7))

## [1.8.0](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.7.0...v1.8.0) (2026-03-25)

### Features

* implement inventory batch movement functionality with DTOs, services, and controller methods ([a041225](https://github.com/clmauriciosoto/api_aromas_armonia/commit/a041225f0dbfbcabcb689ed54b549e1a8a4b661f))

## [1.7.0](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.6.0...v1.7.0) (2026-03-18)

### Features

* add production migration scripts to package.json ([bd5d756](https://github.com/clmauriciosoto/api_aromas_armonia/commit/bd5d7563a8dee132b3d835943501a4c317f67f16))

## [1.6.0](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.5.0...v1.6.0) (2026-03-18)

### Features

* add barcode support to product entity, DTOs, and service methods ([19994af](https://github.com/clmauriciosoto/api_aromas_armonia/commit/19994af1d4072401c5789e2ee5f92777a7f91ab2))

## [1.5.0](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.4.2...v1.5.0) (2026-03-18)

### Features

* add search functionality to GetPublicProductsQueryDto and ProductsService ([49c88d9](https://github.com/clmauriciosoto/api_aromas_armonia/commit/49c88d99bc4e1df33fb488b832301c2b6b56e6aa))

## [1.4.2](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.4.1...v1.4.2) (2026-03-15)

### Bug Fixes

* add --ignore-scripts flag to npm ci for production dependencies ([e06749a](https://github.com/clmauriciosoto/api_aromas_armonia/commit/e06749a12e513a61a84fa582ad986c6ae9d421f3))

## [1.4.1](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.4.0...v1.4.1) (2026-03-15)

### Bug Fixes

* **package-lock:** remove unused optional dependencies to reduce package size ([2c7cb03](https://github.com/clmauriciosoto/api_aromas_armonia/commit/2c7cb035df3ef3fb7223bc52a40154121766c84b))

## [1.4.0](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.3.0...v1.4.0) (2026-03-15)

### Features

* Add orders module with order management functionality ([520daf8](https://github.com/clmauriciosoto/api_aromas_armonia/commit/520daf804ef28ca349962f5da4de45d48f56f598))
* **auth:** add configurable JWT expiration and refresh expiration settings ([f3043ec](https://github.com/clmauriciosoto/api_aromas_armonia/commit/f3043eccdb71ea21343ea57cc2d6c81114de304f))
* **auth:** implement JWT authentication with admin role management ([9767489](https://github.com/clmauriciosoto/api_aromas_armonia/commit/976748985a4899c17dfa4fbff97094b6841cb151))
* implement product backfill script and update product management features ([7159bca](https://github.com/clmauriciosoto/api_aromas_armonia/commit/7159bcae916b8a352ba7775b3c805f121a90a5d5))
* implement sales and inventory management features ([eabe472](https://github.com/clmauriciosoto/api_aromas_armonia/commit/eabe4729791f86f2068f5ad515947265bc7ffada))
* **inventory:** enhance inventory module to include all active products and improve response handling ([bb62711](https://github.com/clmauriciosoto/api_aromas_armonia/commit/bb62711c60dc913a77d9b5b47af16540c54fbe1b))
* **inventory:** implement inventory module with CRUD operations and stock management ([710adfb](https://github.com/clmauriciosoto/api_aromas_armonia/commit/710adfbefb661a9dbf5885dddd5b6665a4f2b546))
* **migrations:** add migration to drop priceInCents and discountInCents columns from product table ([14581ab](https://github.com/clmauriciosoto/api_aromas_armonia/commit/14581ab91c194e9199cbbd2b120bc1dd4f50b0b1))
* **orders:** add AdminOrdersController for managing orders with pagination and filters ([159239a](https://github.com/clmauriciosoto/api_aromas_armonia/commit/159239a1448aaa97fa803fe7f3f289b65df3478a))
* **orders:** add cart and checkout feature flags with admin management endpoints ([b9e7d72](https://github.com/clmauriciosoto/api_aromas_armonia/commit/b9e7d7278192c27243c673b5c9edacef403c31d6))
* **orders:** add order detail retrieval with detailed response DTO ([8628e97](https://github.com/clmauriciosoto/api_aromas_armonia/commit/8628e979496bcc46ba89e2e0e5eaa9ddbcf34634))
* **orders:** add Swagger documentation and pagination for orders endpoint ([beed778](https://github.com/clmauriciosoto/api_aromas_armonia/commit/beed778b1e0d4d4dfb6e1c21a375a0edfd2f4999))
* **products:** add stock field to Product entity and integrate inventory data in ProductsService ([c990dd5](https://github.com/clmauriciosoto/api_aromas_armonia/commit/c990dd5845406d64ec54f8b3662a7856754d9cdf))
* **products:** enhance update product functionality with image handling and validation ([131924e](https://github.com/clmauriciosoto/api_aromas_armonia/commit/131924edf889ac84ff3b1a82a63b6970b3b77c0a))
* **products:** update product relations to include images and refine update restrictions ([f7e26a1](https://github.com/clmauriciosoto/api_aromas_armonia/commit/f7e26a12a90a8b74a4fffc67c5540485f21a5612))
* **sales:** add orderId and orderStatusBeforeSale to sales entity and DTO, enhance sale creation logic ([fe72360](https://github.com/clmauriciosoto/api_aromas_armonia/commit/fe7236081a8264d7b96b0b19252f040d3243e312))
* **storage:** implement Cloudinary storage service for image uploads and create storage module ([d6d636d](https://github.com/clmauriciosoto/api_aromas_armonia/commit/d6d636d1c5b141097c20c2ceb63d7c32525b46d3))

### Bug Fixes

* **docker:** update startup command and add healthcheck for container ([f575d73](https://github.com/clmauriciosoto/api_aromas_armonia/commit/f575d7369adb0f714c601c579208ed450ee4a182))
* resolve merge conflicts and clean up unused dependencies ([65fdc71](https://github.com/clmauriciosoto/api_aromas_armonia/commit/65fdc7147037a2a1f2b905963c0c570300b5aa13))
* resolve merge conflicts and update package-lock.json dependencies ([ccf277e](https://github.com/clmauriciosoto/api_aromas_armonia/commit/ccf277ee924c6cf61feadb122dd88fe330da5185))

### Refactoring

* **cors:** add logging for allowed and blocked origins in CORS configuration ([af82b91](https://github.com/clmauriciosoto/api_aromas_armonia/commit/af82b9192a32f51390da7165518d7c409decbcbb))
* **cors:** enhance CORS handling by allowing multiple origins and improving localhost checks ([7c2a1d2](https://github.com/clmauriciosoto/api_aromas_armonia/commit/7c2a1d25123cdf12935635aca6ee1e0da5bd1228))
* **orders:** remove InventoryModule and InventoryService from Orders module and service ([0299f53](https://github.com/clmauriciosoto/api_aromas_armonia/commit/0299f53218a31d63b8a073a95518939184065687))

## [1.3.0](https://github.com/clmauriciosoto/api_aromas_armonia/compare/v1.2.2...v1.3.0) (2026-03-15)

### Features

* add semantic release configuration for automated versioning and changelog generation ([6c0991e](https://github.com/clmauriciosoto/api_aromas_armonia/commit/6c0991ec2c6bc74651098a50db56855e67788afa))

### Documentation

* update readme ([6d89196](https://github.com/clmauriciosoto/api_aromas_armonia/commit/6d89196e22a359680d00b261c5fb0b6b2ad22546))

# Changelog

Todos los cambios importantes de este proyecto se documentarán en este archivo.
