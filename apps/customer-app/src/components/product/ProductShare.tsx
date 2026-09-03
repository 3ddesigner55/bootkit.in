"use client";

import { Share2 } from "lucide-react";
import type { Product } from "@/types/product";

type Props = {
  product: Product;
};

export default function ProductShare({
  product,
}: Props) {
  const share = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.name,
          url,
        });
      } catch {}
      return;
    }

    await navigator.clipboard.writeText(url);

    alert("Product link copied.");
  };

  return (
    <button
      onClick={share}
      className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-black hover:bg-[var(--surface-soft)]"
    >
      <Share2 size={18} />
      Share Product
    </button>
  );
}