"use client";

import CategorySection from "./CategorySection";
import { getCategories } from "@/services/category.service";
import { getProducts } from "@/services/product.service";
import { useEffect, useState } from "react";

interface HomeSectionsProps {
  onOpen?: (title: string) => void;
}

export default function HomeSections({
  onOpen,
}: HomeSectionsProps) {
  const [activeCategories, setActiveCategories] = useState<any[]>([]);
  const [activeProducts, setActiveProducts] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      getCategories(),
      getProducts({ limit: 100 }).then((res) => res.items)
    ])
      .then(([cats, prods]) => {
        setActiveCategories(cats);
        setActiveProducts(prods);
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      });
  }, []);

  if (!ready) {
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