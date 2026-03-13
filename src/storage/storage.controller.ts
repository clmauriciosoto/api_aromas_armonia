import {
  BadRequestException,
  Controller,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { STORAGE_SERVICE } from './interfaces/storage.interface';
import type { IStorageService } from './interfaces/storage.interface';
import { ProductImage } from '../products/entities/product-image.entity';
import { Product } from '../products/entities/product.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../users/entities/admin.entity';

@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN)
export class StorageController {
  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {}

  @Post('products/images/bulk-by-filename')
  @UseInterceptors(
    FilesInterceptor('files', 100, { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async bulkUploadByFilename(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{
    total: number;
    uploaded: number;
    failed: number;
    successes: Array<{ fileName: string; productId: number; imageId: number; url: string }>;
    errors: Array<{ fileName: string; reason: string }>;
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const successes: Array<{
      fileName: string;
      productId: number;
      imageId: number;
      url: string;
    }> = [];
    const errors: Array<{ fileName: string; reason: string }> = [];

    for (const file of files) {
      const fileName = file.originalname;

      const match = fileName.match(/^(\d+)(?:\.[^.]+)?$/);
      if (!match) {
        errors.push({
          fileName,
          reason: 'Invalid filename format. Expected "<productId>.<ext>"',
        });
        continue;
      }

      const productId = Number(match[1]);
      if (!Number.isInteger(productId) || productId <= 0) {
        errors.push({ fileName, reason: 'Invalid product ID in filename' });
        continue;
      }

      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        errors.push({
          fileName,
          reason: `Product ${productId} not found`,
        });
        continue;
      }

      try {
        const { url } = await this.storageService.uploadFile(
          file.buffer,
          file.mimetype,
          { folder: `products/${productId}` },
        );

        const lastImage = await this.productImageRepository.findOne({
          where: { productId },
          order: { position: 'DESC' },
        });

        const nextPosition = lastImage ? lastImage.position + 1 : 0;
        const isFirst = nextPosition === 0;

        const image = await this.productImageRepository.save(
          this.productImageRepository.create({
            productId,
            url,
            position: nextPosition,
            isPrimary: isFirst,
          }),
        );

        product.image = url;
        await this.productRepository.save(product);

        successes.push({
          fileName,
          productId,
          imageId: image.id,
          url,
        });
      } catch {
        errors.push({
          fileName,
          reason: 'Upload failed',
        });
      }
    }

    return {
      total: files.length,
      uploaded: successes.length,
      failed: errors.length,
      successes,
      errors,
    };
  }

  @Post('products/:productId/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadProductImage(
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProductImage> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const { url } = await this.storageService.uploadFile(
      file.buffer,
      file.mimetype,
      { folder: `products/${productId}` },
    );

    const lastImage = await this.productImageRepository.findOne({
      where: { productId },
      order: { position: 'DESC' },
    });

    const nextPosition = lastImage ? lastImage.position + 1 : 0;
    const isFirst = nextPosition === 0;

    const image = this.productImageRepository.create({
      productId,
      url,
      position: nextPosition,
      isPrimary: isFirst,
    });

    return this.productImageRepository.save(image);
  }
}
