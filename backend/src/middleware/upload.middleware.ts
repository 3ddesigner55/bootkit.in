import multer from 'multer';
import { HTTP_STATUS } from '../constants/httpStatus';
import { IMAGE_MIME_TYPES, type ImageMimeType } from '../types/upload';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;

const CSV_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/csv',
  'text/x-csv',
];

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

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_CSV_SIZE_BYTES,
  },
  fileFilter: (_request, file, callback) => {
    const isAllowedMime = CSV_MIME_TYPES.includes(file.mimetype);
    const isCsvExtension = file.originalname.toLowerCase().endsWith('.csv');

    if (!isAllowedMime && !isCsvExtension) {
      const error = Object.assign(
        new Error('Only CSV files (.csv, text/csv) are allowed.'),
        { statusCode: HTTP_STATUS.BAD_REQUEST },
      );
      callback(error);
      return;
    }

    callback(null, true);
  },
});
