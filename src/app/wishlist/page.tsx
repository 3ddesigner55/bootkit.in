"use client";

import { Heart } from "lucide-react";
import WishlistCompactCard from "@/components/wishlist/WishlistCompactCard";
import { useWishlist } from "@/hooks/useWishlist";

export default function WishlistPage() {
  const { items, hydrated } = useWishlist();

  return (
    <div className="min-h-screen bg-[#F8FAF8] pb-28">
      <main className="mx-auto max-w-md px-3 py-4">
        {!hydrated ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] animate-pulse rounded-[20px] bg-white"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <section className="flex min-h-[calc(100svh-10rem)] flex-col items-center justify-center px-5 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-[var(--danger)]">
              <Heart size={35} fill="currentColor" />
            </span>

            <h1 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
              Your wishlist is empty
            </h1>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Start adding your favourite products.
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((product) => (
              <WishlistCompactCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
