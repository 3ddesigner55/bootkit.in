"use client";

import Link from "next/link";

import type { Product } from "@/types/product";

import ProductCard from "./ProductCard";

type SimilarProductsProps = {
  categorySlug: string;
  products: Product[];
};

export default function SimilarProducts({
  categorySlug,
  products,
}: SimilarProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3 px-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">
            Similar products
          </h2>
          <p className="mt-0.5 text-xs font-medium text-[var(--text-muted)]">
            More from this category
          </p>
        </div>
        <Link
          href={`/category/${categorySlug}`}
          className="text-xs font-black text-[var(--primary)]"
        >
          View all
        </Link>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {products.map((product) => (
          <div key={product.id} className="w-[168px] shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
