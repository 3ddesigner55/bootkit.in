import type { Product } from "@/types/product";

export type WishlistContextValue = {
  items: Product[];
  totalItems: number;
  hydrated: boolean;
  isWishlisted: (productId: string) => boolean;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
};