import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductRelation } from './entities/product-relation.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { DataSource } from 'typeorm';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const repositoryMock = {};
    const dataSourceMock = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(Attribute),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(Inventory),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(ProductRelation),
          useValue: repositoryMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
