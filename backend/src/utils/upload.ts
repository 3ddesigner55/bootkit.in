import type { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary';
import type { UploadedImage, UploadImageOptions } from '../types/upload';

function toUploadedImage(result: UploadApiResponse): UploadedImage {
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    url: result.url,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

export function uploadImage(
  buffer: Buffer,
  options: UploadImageOptions = {},
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: options.folder,
        public_id: options.publicId,
        overwrite: options.overwrite,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary did not return an upload result.'));
          return;
        }

        resolve(toUploadedImage(result));
      },
    );

    uploadStream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
}
