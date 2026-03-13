export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export interface UploadOptions {
  folder?: string;
  publicId?: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface IStorageService {
  uploadFile(
    buffer: Buffer,
    mimeType: string,
    options?: UploadOptions,
  ): Promise<UploadResult>;
}
