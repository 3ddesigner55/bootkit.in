"use client";

import { useEffect, useState } from "react";
import type { Product, ProductVariant } from "@/types/product";
import { formatPrice, percentageOff } from "@/lib/utils";

type Props = {
  product: Product;
  onChange?: (variant: ProductVariant | undefined) => void;
};

export default function ProductVariantSelector({
  product,
  onChange,
}: Props) {
  const variants = product.variants?.filter((variant) => variant.active).map((variant) => ({
    ...variant,
    label: variant.name || variant.unit.label,
  })) ?? [
    {
      id: product.id,
      label: product.unit.label,
      price: product.price,
      mrp: product.mrp,
      stock: product.stock,
      image: product.image,
      sku: product.slug,
    },
  ];

  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setSelected(0);
    const firstVariant = variants[0];
    onChange?.("unit" in firstVariant ? firstVariant : undefined);
  // Product changes reset selection; callback is intentionally invoked only then.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">
        Select Pack
      </p>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {variants.map((variant, index) => {
          const discount = percentageOff(
            variant.mrp,
            variant.price
          );

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => {
                setSelected(index);
                onChange?.("unit" in variant ? variant : undefined);
              }}
              className={`min-w-[140px] rounded-2xl border-2 p-4 text-left transition ${
                selected === index
                  ? "border-[var(--primary)] bg-white shadow-md"
                  : "border-[var(--border)] bg-white hover:border-[var(--primary)]"
              }`}
            >
              <p className="text-sm font-black">
                {variant.label}
              </p>

              {"color" in variant && variant.color && (
                <p className="mt-1 text-[10px] font-bold text-[var(--text-muted)]">
                  {variant.color}{variant.size ? ` · ${variant.size}` : ""}
                </p>
              )}

              <p className="mt-2 text-lg font-black">
                {formatPrice(variant.price)}
              </p>

              {variant.mrp > variant.price && (
                <p className="text-xs line-through text-[var(--text-muted)]">
                  {formatPrice(variant.mrp)}
                </p>
              )}

              {discount > 0 && (
                <span className="mt-2 inline-flex rounded-lg bg-green-50 px-2 py-1 text-[10px] font-black text-green-700">
                  {discount}% OFF
                </span>
              )}

              <p
                className={`mt-3 text-xs font-bold ${
                  variant.stock > 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {variant.stock > 0
                  ? "In Stock"
                  : "Out of Stock"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
