"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProductCard from "@/components/product/ProductCard";
import { getHome } from "@/services/home.service";
import type { Product } from "@/types/product";

interface SweetToothProps {
  products?: Product[];
  title?: string;
}

export default function SweetTooth({
  products: initialProducts,
  title = "Sweet Tooth",
}: SweetToothProps = {}) {
  const isDynamicMode = initialProducts !== undefined;
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!isDynamicMode);

  useEffect(() => {
    if (isDynamicMode) {
      setProducts(initialProducts || []);
      setLoading(false);
      return;
    }

    let cancelled = false;

    getHome()
      .then((data) => {
        if (!cancelled && data.sweetTooth) {
          setProducts(data.sweetTooth as unknown as Product[]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialProducts, isDynamicMode]);

  if (loading || products.length === 0) {
    return null;
  }

  const categorySlug = products[0]?.categorySlug || (products[0] as any)?.category?.slug || "sweet-tooth";

  return (
    <section className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>

        
      </div>

      <div className="grid grid-cols-3 gap-3">
        {products.slice(0, 6).map((product) => (
          <ProductCard
  key={product.id}
  product={product}
  variant="bestSellerPopup"
/>
        ))}
      </div>
      <Link
          href={`/category/${categorySlug}`}
          className="text-sm font-semibold text-green-600"
        >
          See All
        </Link>
    </section>
  );
}