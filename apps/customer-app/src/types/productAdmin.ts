import type { Product } from "@/types/product";

export type ProductInput = Omit<Product, "id"> & {
  id?: string;
};

export type ProductAdminContextValue = {
  products: Product[];
  activeProducts: Product[];
  hydrated: boolean;

  getProductById: (
    productId: string
  ) => Product | undefined;

  getProductBySlug: (
    slug: string,
    includeInactive?: boolean
  ) => Product | undefined;

  addProduct: (input: ProductInput) => Product;

  updateProduct: (
    productId: string,
    updates: Partial<Product>
  ) => Product | null;

  removeProduct: (productId: string) => void;

  toggleProductActive: (
    productId: string
  ) => void;

  toggleProductFeatured: (
    productId: string
  ) => void;

  toggleProductBestseller: (
    productId: string
  ) => void;

  resetProducts: () => void;
};