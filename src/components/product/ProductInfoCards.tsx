"use client";

import { Box, MapPin, RotateCcw, Snowflake } from "lucide-react";

import type { Product } from "@/types/product";

type ProductInfoCardsProps = {
  product: Product;
  deliveryMinutes: number;
};

export default function ProductInfoCards({
  product,
  deliveryMinutes,
}: ProductInfoCardsProps) {
  const cards = [
    {
      icon: RotateCcw,
      title: "Replacement policy",
      detail: "Support for damaged or incorrect items",
    },
    {
      icon: MapPin,
      title: "Delivery information",
      detail: `Delivery in about ${deliveryMinutes} minutes`,
    },
    {
      icon: Snowflake,
      title: "Storage",
      detail: "Store as per pack instructions",
    },
    {
      icon: Box,
      title: "Country of origin",
      detail: product.tags?.find((tag) => tag.startsWith("Country:")) ?? "See pack for origin",
    },
  ];

  return (
    <section className="rounded-2xl border border-[#EEF2EF] bg-white p-4 shadow-[0_4px_16px_rgba(25,50,34,0.05)]">
      <h2 className="text-base font-black text-[var(--text-primary)]">
        Product information
      </h2>
      <div className="mt-3 divide-y divide-[#EEF2EF]">
        {cards.map(({ icon: Icon, title, detail }) => (
          <div key={title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECF8EF] text-[var(--primary)]">
              <Icon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-[var(--text-primary)]">
                {title}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-[var(--text-secondary)]">
                {detail.replace("Country:", "")}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
