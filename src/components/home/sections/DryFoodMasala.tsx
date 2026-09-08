"use client";

import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

interface DryFoodMasalaProps {
  products?: Product[];
  title?: string;
  viewAllUrl?: string;
}

export default function DryFoodMasala({
  products: initialProducts,
  title = "Dry Food & Masala",
  viewAllUrl,
}: DryFoodMasalaProps = {}) {
  if (!initialProducts || initialProducts.length === 0) {
    return null;
  }

  const items = initialProducts;
  const firstProd = items.find(item => typeof item === "object" && item !== null) as Product | undefined;
  const resolvedViewAll = viewAllUrl || (firstProd ? `/category/${(firstProd as any).categorySlug || (firstProd as any).category?.slug || "dry-food-masala"}` : "/category/dry-food-masala");

  return (
    <section className="mt-8 px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {title}
        </h2>

        <Link
          href={resolvedViewAll}
          className="text-sm font-semibold text-green-600 hover:text-green-700 transition"
        >
          See All
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3">
        {items.slice(0, 6).map((product, idx) => (
          <ProductCard
            key={product.id || (product as any)._id || idx}
            product={product}
            variant="bestSellerPopup"
          />
        ))}
      </div>
    </section>
  );
}