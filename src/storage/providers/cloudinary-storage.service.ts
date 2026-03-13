import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import {
  IStorageService,
  UploadOptions,
  UploadResult,
} from '../interfaces/storage.interface';

@Injectable()
export class CloudinaryStorageService implements IStorageService {
  constructor(private readonly configService: ConfigService) {
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!apiSecret) {
      throw new InternalServerErrorException(
        'Storage provider environment variables are missing',
      );
    }

    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: apiSecret,
      secure: true,
    });
  }

  uploadFile(
    buffer: Buffer,
    _mimeType: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        resource_type: 'image',
        ...(options.folder && { folder: options.folder }),
        ...(options.publicId && { public_id: options.publicId }),
      };

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            return reject(error ?? new Error('Cloudinary upload failed'));
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );

      stream.end(buffer);
    });
  }
}
