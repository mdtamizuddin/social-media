import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    base64Str: string,
    folder: string = 'posts',
  ): Promise<string> {
    try {
      // If the base64 string doesn't start with the data url prefix, add it (assuming jpeg default)
      const dataUri = base64Str.startsWith('data:')
        ? base64Str
        : `data:image/jpeg;base64,${base64Str}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
      });

      return result.secure_url;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Cloudinary upload failed: ${errMsg}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Cloudinary delete failed: ${errMsg}`);
    }
  }
}
