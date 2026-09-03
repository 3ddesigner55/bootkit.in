import type { Product } from "@/types/product";

export type RecentlyViewedContextValue = {
  items: Product[];
  hydrated: boolean;
  addRecentlyViewed: (product: Product) => void;
  removeRecentlyViewed: (productId: string) => void;
  clearRecentlyViewed: () => void;
};