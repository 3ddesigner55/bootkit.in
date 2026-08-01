"use client";

import Link from "next/link";
import {
  Check,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";

type FrequentlyBoughtTogetherProps = {
  product: Product;
};

export default function FrequentlyBoughtTogether({
  product,
}: FrequentlyBoughtTogetherProps) {
  const { addItem, hydrated } = useCart();
  const { activeProducts } = useAdminProducts();

  const suggestedProducts = useMemo(
    () =>
      activeProducts
        .filter(
          (item) =>
            item.id !== product.id &&
            item.stock > 0
        )
        .sort((a, b) => {
          const aSameCategory =
            a.categorySlug === product.categorySlug ? 1 : 0;

          const bSameCategory =
            b.categorySlug === product.categorySlug ? 1 : 0;

          return bSameCategory - aSameCategory;
        })
        .slice(0, 2),
    [activeProducts, product]
  );

  const allProducts = useMemo(
    () => [product, ...suggestedProducts],
    [product, suggestedProducts]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    allProducts.map((item) => item.id)
  );

  const selectedProducts = allProducts.filter((item) =>
    selectedIds.includes(item.id)
  );

  const totalPrice = selectedProducts.reduce(
    (total, item) => total + item.price,
    0
  );

  const totalMrp = selectedProducts.reduce(
    (total, item) => total + item.mrp,
    0
  );

  const totalSavings = Math.max(totalMrp - totalPrice, 0);

  const toggleProduct = (productId: string) => {
    if (productId === product.id) return;

    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const addSelectedToCart = () => {
    selectedProducts.forEach((item) => {
      addItem(item);
    });
  };

  if (suggestedProducts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
      <div>
        <h2 className="text-xl font-black tracking-[-0.035em] text-[var(--text-primary)]">
          Frequently bought together
        </h2>

        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Select products and add them together
        </p>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {allProducts.map((item, index) => {
          const selected = selectedIds.includes(item.id);
          const locked = item.id === product.id;

          return (
            <div
              key={item.id}
              className="flex shrink-0 items-center gap-3"
            >
              {index > 0 && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--primary)]">
                  <Plus size={16} />
                </span>
              )}

              <article
                className={`relative w-[160px] rounded-[20px] border p-3 transition ${
                  selected
                    ? "border-[var(--primary)] bg-[var(--primary-light)]"
                    : "border-[var(--border)] bg-white opacity-70"
                }`}
              >
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => toggleProduct(item.id)}
                  aria-label={
                    selected
                      ? `Remove ${item.name}`
                      : `Select ${item.name}`
                  }
                  className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border ${
                    selected
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border-strong)] bg-white text-transparent"
                  }`}
                >
                  <Check size={14} />
                </button>

                <Link
                  href={`/product/${item.slug}`}
                  className="flex aspect-square items-center justify-center rounded-[15px] bg-white text-[58px]"
                >
                  <span aria-hidden="true">
                    {item.fallbackIcon}
                  </span>
                </Link>

                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)]">
                  {item.brand}
                </p>

                <Link href={`/product/${item.slug}`}>
                  <h3 className="mt-1 line-clamp-2 min-h-10 text-xs font-black leading-5 text-[var(--text-primary)]">
                    {item.name}
                  </h3>
                </Link>

                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  {item.unit.label}
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-sm font-black text-[var(--text-primary)]">
                    {formatPrice(item.price)}
                  </span>

                  {item.mrp > item.price && (
                    <span className="text-[9px] text-[var(--text-muted)] line-through">
                      {formatPrice(item.mrp)}
                    </span>
                  )}
                </div>
              </article>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-[var(--surface-soft)] p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {selectedProducts.length} products selected
            </p>

            <p className="mt-1 text-xl font-black text-[var(--text-primary)]">
              {formatPrice(totalPrice)}
            </p>

            {totalSavings > 0 && (
              <p className="mt-1 text-[10px] font-bold text-[var(--success)]">
                Save {formatPrice(totalSavings)}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={
              !hydrated ||
              selectedProducts.length === 0
            }
            onClick={addSelectedToCart}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-xs font-black text-white disabled:opacity-50"
          >
            <ShoppingBag size={17} />
            Add selected
          </button>
        </div>
      </div>
    </section>
  );
}
