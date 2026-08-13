"use client";

import Link from "next/link";
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
  const isDynamicMode = initialProducts !== undefined;

  if (isDynamicMode && (!initialProducts || initialProducts.length === 0)) {
    return null;
  }

  const items = isDynamicMode ? initialProducts : [1, 2, 3, 4, 5, 6];
  const firstProd = items.find(item => typeof item === "object" && item !== null) as Product | undefined;
  const resolvedViewAll = viewAllUrl || (firstProd ? `/category/${(firstProd as any).categorySlug || (firstProd as any).category?.slug || "dry-food-masala"}` : "/category/dry-food-masala");

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {title}
        </h2>

        <Link
          href={resolvedViewAll}
          className="text-sm font-semibold text-green-600"
        >
          See All
        </Link>
      </div>

      {/* Products */}
      <div className="grid grid-cols-3 gap-2">
        {items.slice(0, 6).map((item, idx) => {
          const isProduct = typeof item === "object" && item !== null;
          const name = isProduct ? (item as Product).name : "Sprite Limca Flavored Soft Drink";
          const price = isProduct ? (item as Product).price : 38;
          const image = isProduct ? ((item as Product).image || "/images/products/sprite.png") : "/images/products/sprite.png";

          return (
            <div
              key={isProduct ? (item as Product).id : idx}
              className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
            >
              {/* Image */}
              <div className="relative">
                <button className="absolute right-2 top-2 z-10 rounded-full bg-white p-1 shadow">
                  🤍
                </button>

                <div className="h-24 overflow-hidden rounded-lg bg-gray-50">
                  <img
                    src={image}
                    alt={name}
                    className="mx-auto h-20 w-20 object-contain"
                  />
                </div>

                <div className="mt-2 flex justify-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-500">750 ml</span>

                <button className="rounded-md border border-green-600 px-2 py-1 text-[11px] font-bold text-green-600">
                  ADD
                </button>
              </div>

              <p className="mt-2 text-base font-bold">₹{price}</p>

              <p className="text-xs font-medium text-green-600">
                5% OFF
              </p>

              <h3 className="mt-2 line-clamp-2 text-xs font-medium">
                {name}
              </h3>

              <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                <span>⭐ 4.8</span>
                <span>⚡ 8 min</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Button */}
      <div className="mt-5 text-center">
        <Link
          href="/category/dry-food-masala"
          className="text-sm font-semibold text-green-600"
        >
          See All
        </Link>
      </div>
    </section>
  );
}