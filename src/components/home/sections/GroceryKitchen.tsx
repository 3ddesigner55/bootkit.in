"use client";

import SectionBlock from "./SectionBlock";
import { useAdminCategories } from "@/hooks/useAdminCategories";

export default function GroceryKitchen() {
  const {
    activeCategories,
    hydrated,
  } = useAdminCategories();

  if (!hydrated) {
    return null;
  }

  const groceryItems = activeCategories
    .filter((category) =>
      [
        "fruits-vegetables",
        "atta-rice-dal",
        "dairy-breakfast",
        "bakery-biscuits",
      ].includes(category.slug)
    )
    .map((category) => ({
      name: category.name,
      slug: category.slug,
      image: `/images/categories/${category.slug}.png`,
    }));

  return (
    <SectionBlock
      title="Grocery & Kitchen"
      items={groceryItems}
    />
  );
}