export type ProductUnit = {
  label: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  color?: string;
  size?: string;
  weight?: string;

  image?: string;
  images?: string[];
  attributes?: Record<string, string>;

  unit: ProductUnit;

  mrp: number;
  price: number;
  stock: number;

  active: boolean;
};

export type Product = {
  description: string;
  id: string;
  name: string;

  slug: string;
  brand: string;
  categorySlug: string;
  variants?: ProductVariant[];
  tags?: string[];
  image: string;
  images?: string[];
  gallery: string[];
  thumbnail?: string;
  sku: string;
  barcode: string;

  fallbackIcon: string;

  unit: ProductUnit;

  mrp: number;
  price: number;
  stock: number;

  rating: number;
  reviewCount: number;

  deliveryMinutes: number;

  featured: boolean;
  bestseller: boolean;
  showOnHome: boolean;
  displayOrder: number;
  active: boolean;
  attributes?: { label: string; value: string }[];
  highlights?: string[];
  videoUrl?: string;
  ingredients?: string;
  storageInstructions?: string;
  usageInstructions?: string;
  replacementPolicy?: string;
};
