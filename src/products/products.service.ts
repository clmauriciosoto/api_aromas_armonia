import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  IsNull,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Attribute } from '../attributes/entities/attribute.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import {
  GetAdminProductsQueryDto,
  ProductSortBy,
  SortOrder,
} from './dto/get-admin-products-query.dto';
import { Inventory } from '../inventory/entities/inventory.entity';
import { ProductStatus } from './entities/product-status.enum';
import { GetPublicProductsQueryDto } from './dto/get-public-products-query.dto';
import { ProductImage } from './entities/product-image.entity';
import { UpdateProductImageDto } from './dto/update-product.dto';

export type PaginatedProductsResponse = {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ProductAdminResponse = Omit<Product, 'deletedAt'>;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const price = this.resolvePrice(createProductDto);
    const discountPrice = this.resolveDiscountPrice(createProductDto);
    this.validateDiscount(price, discountPrice);
    const productName: string = createProductDto.name;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.assertUniqueFields(
        productName,
        (createProductDto as { vendorCode?: string }).vendorCode,
        undefined,
        queryRunner.manager,
      );

      const slug = await this.generateUniqueSlug(
        productName,
        queryRunner.manager,
      );

      const productRepository: Repository<Product> =
        queryRunner.manager.getRepository(Product);
      const product: Product = productRepository.create({
        name: productName,
        shortDescription: createProductDto.shortDescription,
        description: createProductDto.description,
        slug,
        status: ProductStatus.ACTIVE,
        isPurchasable:
          (createProductDto as { isPurchasable?: boolean }).isPurchasable ??
          true,
        currency: 'CLP',
        vendorCode:
          (createProductDto as { vendorCode?: string }).vendorCode ?? null,
        image: createProductDto.image ?? null,
        price,
        discountPrice,
      });

      if (createProductDto.attributesIds?.length) {
        product.attributes = await this.attributeRepository.findBy({
          id: In(createProductDto.attributesIds),
        });
      }

      const savedProduct: Product = await productRepository.save(product);

      const inventoryRepository = queryRunner.manager.getRepository(Inventory);
      await inventoryRepository.save(
        inventoryRepository.create({
          productId: savedProduct.id,
          quantity: 0,
          reservedQuantity: 0,
        }),
      );

      await queryRunner.commitTransaction();
      return this.findOneAdmin(savedProduct.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.rethrowPersistenceError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        status: ProductStatus.ACTIVE,
        isPurchasable: true,
        deletedAt: IsNull(),
      },
      relations: ['attributes', 'images'],
      order: { id: 'ASC' },
    });
  }

  async findPublic(
    query: GetPublicProductsQueryDto,
  ): Promise<PaginatedProductsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const whereClause = {
      status: ProductStatus.ACTIVE,
      isPurchasable: true,
      deletedAt: IsNull(),
    };

    const total = await this.productRepository.count({
      where: whereClause,
    });

    const pageRows = await this.productRepository.find({
      where: whereClause,
      select: ['id'],
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pageIds = pageRows.map((row) => row.id);

    if (pageIds.length === 0) {
      return {
        data: [],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const data = await this.productRepository.find({
      where: {
        id: In(pageIds),
        status: ProductStatus.ACTIVE,
        isPurchasable: true,
        deletedAt: IsNull(),
      },
      relations: ['attributes', 'images'],
    });

    data.sort((a, b) => pageIds.indexOf(a.id) - pageIds.indexOf(b.id));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        id,
        status: ProductStatus.ACTIVE,
        isPurchasable: true,
        deletedAt: IsNull(),
      },
      relations: ['attributes', 'images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findOneBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        slug,
        status: ProductStatus.ACTIVE,
        isPurchasable: true,
        deletedAt: IsNull(),
      },
      relations: ['attributes', 'images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findAdmin(
    query: GetAdminProductsQueryDto,
  ): Promise<PaginatedProductsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.attributes', 'attributes')
      .withDeleted();

    if (query.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.shortDescription ILIKE :search OR product.vendorCode ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.status) {
      qb.andWhere('product.status = :status', { status: query.status });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('COALESCE(product.price, 0) >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('COALESCE(product.price, 0) <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    const sortBy = query.sortBy ?? ProductSortBy.ID;
    const sortOrder = query.sortOrder ?? SortOrder.DESC;

    if (sortBy === ProductSortBy.PRICE) {
      qb.orderBy('COALESCE(product.price, 0)', sortOrder);
    } else {
      qb.orderBy(`product.${sortBy}`, sortOrder);
    }
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAdmin(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['attributes', 'images'],
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductAdminResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productRepository = queryRunner.manager.getRepository(Product);
      const attributeRepository = queryRunner.manager.getRepository(Attribute);
      const productImageRepository =
        queryRunner.manager.getRepository(ProductImage);

      const product = await productRepository.findOne({
        where: { id },
        relations: ['attributes'],
        withDeleted: true,
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const nextPrice = this.resolvePrice(updateProductDto, product.price ?? 0);
      const nextDiscount = this.resolveDiscountPrice(
        updateProductDto,
        product.discountPrice,
      );

      this.validateDiscount(nextPrice, nextDiscount);

      const shouldRegenerateSlug =
        updateProductDto.name !== undefined &&
        updateProductDto.name !== product.name &&
        (product.slug === null || updateProductDto.regenerateSlug === true);

      const nextName = updateProductDto.name ?? product.name;
      const nextVendorCode =
        updateProductDto.vendorCode === null
          ? undefined
          : (updateProductDto.vendorCode ?? product.vendorCode ?? undefined);

      if (
        updateProductDto.name !== undefined ||
        updateProductDto.vendorCode !== undefined
      ) {
        await this.assertUniqueFields(
          nextName,
          nextVendorCode,
          product.id,
          queryRunner.manager,
        );
      }

      if (shouldRegenerateSlug) {
        product.slug = await this.generateUniqueSlug(
          nextName,
          queryRunner.manager,
          id,
        );
      }

      if (updateProductDto.attributeIds !== undefined) {
        const attributes = await attributeRepository.findBy({
          id: In(updateProductDto.attributeIds),
        });

        if (attributes.length !== updateProductDto.attributeIds.length) {
          throw new BadRequestException('One or more attributeIds are invalid');
        }

        product.attributes = attributes;
      }

      if (updateProductDto.images !== undefined) {
        const normalizedImages = this.normalizeAndValidateImages(
          updateProductDto.images,
        );

        await productImageRepository.delete({ productId: id });

        if (normalizedImages.length > 0) {
          const entities = normalizedImages.map((image) =>
            productImageRepository.create({
              productId: id,
              url: image.url,
              position: image.position,
              isPrimary: image.isPrimary,
            }),
          );
          await productImageRepository.save(entities);
        }
      }

      const nextStatus = updateProductDto.status ?? product.status;
      const isArchived = nextStatus === ProductStatus.ARCHIVED;

      product.name = nextName;
      product.shortDescription =
        updateProductDto.shortDescription ?? product.shortDescription;
      product.description = updateProductDto.description ?? product.description;
      product.price = nextPrice;
      product.discountPrice = nextDiscount;
      product.vendorCode =
        updateProductDto.vendorCode !== undefined
          ? updateProductDto.vendorCode
          : product.vendorCode;
      product.status = nextStatus;
      product.isPurchasable = isArchived
        ? false
        : (updateProductDto.isPurchasable ?? product.isPurchasable);
      product.currency = 'CLP';

      await productRepository.save(product);
      await queryRunner.commitTransaction();

      const updatedProduct = await this.findOneAdmin(id);
      return this.toAdminResponse(updatedProduct);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.rethrowPersistenceError(error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async archive(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.deletedAt) {
      return product;
    }

    await this.orderItemRepository.count({ where: { productId: id } });

    product.status = ProductStatus.ARCHIVED;
    product.isPurchasable = false;
    await this.productRepository.save(product);
    await this.productRepository.softRemove(product);

    return this.findOneAdmin(id);
  }

  async remove(id: number): Promise<void> {
    await this.archive(id);
  }

  async assignAttributes(
    productId: number,
    attributeIds: number[],
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['attributes'],
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const attributes = await this.attributeRepository.findBy({
      id: In(attributeIds),
    });
    product.attributes = attributes;

    return this.productRepository.save(product);
  }

  private resolvePrice(
    payload: { price?: number | null },
    fallback = 0,
  ): number {
    if (payload.price !== undefined && payload.price !== null) {
      return payload.price;
    }
    return fallback;
  }

  private resolveDiscountPrice(
    payload: { discountPrice?: number | null },
    fallback: number | null = null,
  ): number | null {
    if (payload.discountPrice !== undefined) {
      return payload.discountPrice;
    }
    return fallback;
  }

  private validateDiscount(
    priceAmount: number,
    discountAmount?: number | null,
  ): void {
    if (priceAmount < 0) {
      throw new BadRequestException('price must be greater than or equal to 0');
    }

    if (discountAmount === undefined || discountAmount === null) {
      return;
    }

    if (discountAmount >= priceAmount) {
      throw new BadRequestException('discountPrice must be lower than price');
    }
  }

  private async assertUniqueFields(
    name: string,
    vendorCode?: string,
    ignoreProductId?: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repository =
      manager?.getRepository(Product) ?? this.productRepository;

    const nameWhere: FindOptionsWhere<Product> = ignoreProductId
      ? { name, id: Not(ignoreProductId) }
      : { name };

    const existingByName = await repository.findOne({
      where: nameWhere,
      withDeleted: true,
    });

    if (existingByName) {
      throw new ConflictException('A product with this name already exists');
    }

    if (!vendorCode) {
      return;
    }

    const vendorWhere: FindOptionsWhere<Product> = ignoreProductId
      ? { vendorCode, id: Not(ignoreProductId) }
      : { vendorCode };

    const existingByVendorCode = await repository.findOne({
      where: vendorWhere,
      withDeleted: true,
    });

    if (existingByVendorCode) {
      throw new ConflictException(
        'A product with this vendorCode already exists',
      );
    }
  }

  private async generateUniqueSlug(
    name: string,
    manager?: EntityManager,
    ignoreProductId?: number,
  ): Promise<string> {
    const repository =
      manager?.getRepository(Product) ?? this.productRepository;
    const baseSlug = this.slugify(name) || 'product';
    let candidate = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await repository.findOne({
        where: ignoreProductId
          ? { slug: candidate, id: Not(ignoreProductId) }
          : { slug: candidate },
        withDeleted: true,
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private validateRestrictedUpdatesWithOrderHistory(
    updateProductDto: UpdateProductDto,
  ): void {
    const restrictedUpdateRequested =
      updateProductDto.name !== undefined ||
      updateProductDto.shortDescription !== undefined ||
      updateProductDto.vendorCode !== undefined ||
      updateProductDto.currency !== undefined ||
      updateProductDto.attributeIds !== undefined;

    if (restrictedUpdateRequested) {
      throw new BadRequestException(
        'Products with order history cannot update identity or attribute metadata fields',
      );
    }
  }

  private normalizeAndValidateImages(
    images: UpdateProductImageDto[],
  ): UpdateProductImageDto[] {
    const sortedImages = [...images].sort((a, b) => a.position - b.position);
    const positionSet = new Set<number>();
    let primaryCount = 0;

    for (const image of sortedImages) {
      if (positionSet.has(image.position)) {
        throw new BadRequestException('Image position values must be unique');
      }
      positionSet.add(image.position);

      if (image.isPrimary) {
        primaryCount += 1;
      }
    }

    if (primaryCount > 1) {
      throw new BadRequestException('Only one image can be primary');
    }

    if (primaryCount === 0 && sortedImages.length > 0) {
      sortedImages[0] = {
        ...sortedImages[0],
        isPrimary: true,
      };
    }

    return sortedImages;
  }

  private toAdminResponse(product: Product): ProductAdminResponse {
    const { deletedAt: _deletedAt, ...response } = product;
    void _deletedAt;
    return response;
  }

  private rethrowPersistenceError(error: unknown): void {
    if (
      error instanceof QueryFailedError &&
      typeof (error as QueryFailedError & { code?: string }).code ===
        'string' &&
      (error as QueryFailedError & { code?: string }).code === '23505'
    ) {
      throw new ConflictException('A unique constraint was violated');
    }
  }
}
