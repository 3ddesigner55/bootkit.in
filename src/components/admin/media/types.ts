export type ImageUploadStatus =
  | "ready"
  | "uploading"
  | "uploaded"
  | "error";

export type ImageUploaderItem = {
  id: string;
  url: string;
  name: string;
  file?: File;
  progress: number;
  status: ImageUploadStatus;
};

export type ImageUploaderProps = {
  value?: ImageUploaderItem[];
  onChange?: (items: ImageUploaderItem[]) => void;
  label?: string;
  helperText?: string;
  multiple?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSizeMB?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};
