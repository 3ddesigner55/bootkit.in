import type { Product, ProductVariant } from "@/types/product";

export type CartItem = {
  product: Product;
  quantity: number;
  variantId?: ProductVariant["id"];
  variantName?: string;
};

export type CartState = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
};
