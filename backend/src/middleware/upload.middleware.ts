import multer from 'multer';
import { IMAGE_MIME_TYPES, type ImageMimeType } from '../types/upload';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_request, file, callback) => {
    const isAllowedType = IMAGE_MIME_TYPES.includes(
      file.mimetype as ImageMimeType,
    );

    if (!isAllowedType) {
      callback(new Error('Only JPEG, PNG, WebP, and AVIF images are allowed.'));
      return;
    }

    callback(null, true);
  },
});
