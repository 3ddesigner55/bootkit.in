"use client";

import ProductSection from "./ProductSection";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminProducts } from "@/hooks/useAdminProducts";

interface HomeSectionsProps {
  onOpen?: (
    title: string,
    slug: string
  ) => void;
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
    {activeCategories
      .sort(
        (a, b) =>
          a.displayOrder - b.displayOrder
      )
      .map((category) => (
        <ProductSection
          key={category.id}
          title={category.name}
          categorySlug={category.slug}
        />
      ))}
  </>
);
}