export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

export type UploadImageOptions = {
  folder?: string;
  publicId?: string;
  overwrite?: boolean;
};

export type UploadedImage = {
  publicId: string;
  secureUrl: string;
  url: string;
  width: number;
  height: number;
  format: string;
};
