"use client";

import ProductSection from "./ProductSection";
import { getCategories } from "@/services/category.service";
import { getProducts } from "@/services/product.service";
import { useEffect, useState } from "react";

interface HomeSectionsProps {
  onOpen?: (
    title: string,
    slug: string
  ) => void;
}

export default function HomeSections({
  onOpen,
}: HomeSectionsProps) {
  const [activeCategories, setActiveCategories] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      getCategories(),
      getProducts({ limit: 100 }).then((res) => res.items)
    ])
      .then(([cats, prods]) => {
        setActiveCategories(cats);
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
    {activeCategories
      .filter((category) => category.showOnHome)
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