"use client";

import { useEffect, useMemo, useState } from "react";

import { formatPrice, percentageOff } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types/product";

type ProductUnitSelectorProps = {
  product: Product;
  onChange: (variant: ProductVariant | undefined) => void;
};

type UnitOption = {
  id: string;
  label: string;
  mrp: number;
  price: number;
  stock: number;
  variant?: ProductVariant;
};

export default function ProductUnitSelector({
  product,
  onChange,
}: ProductUnitSelectorProps) {
  const options = useMemo<UnitOption[]>(
    () => [
      {
        id: "base",
        label: product.unit.label,
        mrp: product.mrp,
        price: product.price,
        stock: product.stock,
      },
      ...(product.variants ?? [])
        .filter((variant) => variant.active)
        .map((variant) => ({
          id: variant.id,
          label: variant.name || variant.unit.label,
          mrp: variant.mrp,
          price: variant.price,
          stock: variant.stock,
          variant,
        })),
    ],
    [product]
  );
  const [selectedOptionId, setSelectedOptionId] = useState("base");

  useEffect(() => {
    setSelectedOptionId("base");
    onChange(undefined);
  }, [onChange, product.id]);

  return (
    <section className="rounded-2xl bg-[#F7FAF8] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">
        Select unit
      </p>
      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {options.map((option) => {
          const isSelected = option.id === selectedOptionId;
          const discount = percentageOff(option.mrp, option.price);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setSelectedOptionId(option.id);
                onChange(option.variant);
              }}
              className={`min-w-[130px] rounded-2xl border-2 bg-white p-3 text-left transition ${
                isSelected
                  ? "border-[var(--primary)] shadow-[0_6px_16px_rgba(44,143,70,0.12)]"
                  : "border-transparent hover:border-[#D5E8DA]"
              }`}
            >
              <p className="text-sm font-black text-[var(--text-primary)]">
                {option.label}
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-base font-black text-[var(--text-primary)]">
                  {formatPrice(option.price)}
                </span>
                {option.mrp > option.price ? (
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] line-through">
                    {formatPrice(option.mrp)}
                  </span>
                ) : null}
              </div>
              {discount > 0 ? (
                <p className="mt-1 text-[10px] font-black text-[var(--success)]">
                  {discount}% off
                </p>
              ) : null}
              <p
                className={`mt-2 text-[10px] font-bold ${
                  option.stock > 0 ? "text-[var(--success)]" : "text-red-500"
                }`}
              >
                {option.stock > 0 ? "In stock" : "Out of stock"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
