"use client";

import Link from "next/link";
import HomeProductCard from "@/components/product/HomeProductCard";
import { getProducts } from "@/services/product.service";
import { useEffect, useState } from "react";

interface ProductSectionProps {
  title: string;
  categorySlug: string;
  limit?: number;
}

export default function ProductSection({
  title,
  categorySlug,
  limit = 6,
}: ProductSectionProps) {
  const [activeProducts, setActiveProducts] = useState<any[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void getProducts({ limit: 100 })
      .then((res) => {
        setActiveProducts(res.items);
        setHydrated(true);
      })
      .catch(() => {
        setActiveProducts([]);
        setHydrated(true);
      });
  }, []);

  if (!hydrated) return null;

  const products = activeProducts
    .filter(
      (product) =>
        product.categorySlug === categorySlug
    )
    .slice(0, limit);

  if (products.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {title}
        </h2>

        <Link
          href={`/category/${categorySlug}`}
          className="text-sm font-semibold text-green-600"
        >
          See All
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
  {products.map((product) => (
    <HomeProductCard
      key={product.id}
      product={product}
    />
  ))}
</div>
    </section>
  );
}