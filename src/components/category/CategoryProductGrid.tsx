"use client";

import { useState } from "react";

import { useAdminProducts } from "@/hooks/useAdminProducts";

import CategoryProductCard from "./CategoryProductCard";
import CategoryEmpty from "./CategoryEmpty";

import ProductBottomSheet from "@/components/product/ProductBottomSheet";

import type { Product } from "@/types/product";

interface CategoryProductGridProps {
  categorySlug: string;
}

export default function CategoryProductGrid({
  categorySlug,
}: CategoryProductGridProps) {
  const {
    activeProducts,
    hydrated,
  } = useAdminProducts();

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [productOpen, setProductOpen] =
    useState(false);

  if (!hydrated) {
    return null;
  }

  const products = activeProducts.filter(
    (product) =>
      product.categorySlug === categorySlug
  );

  if (products.length === 0) {
    return <CategoryEmpty />;
  }

  return (
    <>
      <div className="h-full overflow-y-auto p-4">

        <div className="grid grid-cols-2 gap-4">

          {products.map((product) => (

            <CategoryProductCard
              key={product.id}
              product={product}
              onClick={(product) => {
                setSelectedProduct(product);
                setProductOpen(true);
              }}
            />

          ))}

        </div>

      </div>

      <ProductBottomSheet
        open={productOpen}
        product={selectedProduct}
        onClose={() => {
          setProductOpen(false);
          setSelectedProduct(null);
        }}
      />
    </>
  );
}