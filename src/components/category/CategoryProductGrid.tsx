"use client";

import { useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import CategoryEmpty from "./CategoryEmpty";
import ProductBottomSheet from "@/components/product/ProductBottomSheet";
import type { Product } from "@/types/product";

interface CategoryProductGridProps {
  products: Product[];
  loading?: boolean;
}

export default function CategoryProductGrid({
  products = [],
  loading = false,
}: CategoryProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productOpen, setProductOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F5F7F5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (products.length === 0) {
    return <CategoryEmpty />;
  }


  return (
    <>
      <div className="h-full overflow-y-auto scrollbar-hide bg-[#F5F7F5] p-4">
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="bestSellerPopup"
              onClick={() => {
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
