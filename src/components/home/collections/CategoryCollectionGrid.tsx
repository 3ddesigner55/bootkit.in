"use client";

import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import CategoryCollectionCard from "./CategoryCollectionCard";

export default function CategoryCollectionGrid() {
  const {
    activeCategories,
    hydrated: categoriesReady,
  } = useAdminCategories();

  const {
    activeProducts,
    hydrated: productsReady,
  } = useAdminProducts();

  if (!categoriesReady || !productsReady) {
    return null;
  }

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black">
          Shop by Category
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {activeCategories.map((category) => {
          const products = activeProducts.filter(
            (product) => product.categorySlug === category.slug
          );

          if (products.length === 0) {
            return null;
          }

          return (
            <CategoryCollectionCard
              key={category.id}
              title={category.name}
              slug={category.slug}
              count={`${products.length}+ Items`}
              images={products
                .map((p) => p.image)
                .filter(Boolean)
                .slice(0, 4)}
            />
          );
        })}
      </div>
    </section>
  );
}