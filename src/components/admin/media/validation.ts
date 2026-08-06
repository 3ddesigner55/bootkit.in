export const DEFAULT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const DEFAULT_MAX_FILE_SIZE_MB = 5;

export function validateImageFile(
  file: File,
  acceptedTypes: string[],
  maxFileSizeMB: number
) {
  if (!acceptedTypes.includes(file.type)) {
    return "Use a JPG, PNG, WebP, or AVIF image.";
  }

  if (file.size > maxFileSizeMB * 1024 * 1024) {
    return `Image must be ${maxFileSizeMB} MB or smaller.`;
  }

  return "";
}
