"use client";

import CategorySection from "./CategorySection";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminProducts } from "@/hooks/useAdminProducts";

interface HomeSectionsProps {
  onOpen?: (title: string) => void;
}

export default function HomeSections({
  onOpen,
}: HomeSectionsProps) {
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
    <>
      {activeCategories.map((category) => {
        const items = activeProducts
          .filter(
            (product) =>
              product.categorySlug === category.slug
          )
          .slice(0, 8)
          .map((product) => ({
            name: product.name,
            image: product.image,
          }));

        if (items.length === 0) {
          return null;
        }

        return (
          <CategorySection
            key={category.id}
            title={category.name}
            slug={category.slug}
            items={items}
            onCategoryClick={() =>
              onOpen?.(category.name)
            }
          />
        );
      })}
    </>
  );
}