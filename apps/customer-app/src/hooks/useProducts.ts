"use client";

import { useState } from "react";
import { products as defaultProducts } from "@/data/products";
import type { Product } from "@/types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [hydrated, setHydrated] = useState(true);

  const activeProducts = products.filter((p) => p.active !== false);

  const getProductBySlug = (slug: string) => {
    return products.find((p) => p.slug === slug);
  };

  return {
    products,
    activeProducts,
    hydrated,
    getProductBySlug,
  };
}
