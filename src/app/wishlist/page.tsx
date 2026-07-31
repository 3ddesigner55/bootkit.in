"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/product/ProductCard";
import Container from "@/components/ui/Container";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";

export default function WishlistPage() {
  const {
    items,
    totalItems,
    hydrated,
    clearWishlist,
  } = useWishlist();
  const { addItems } = useCart();

  const moveAllToCart = () => {
    addItems(items.map((product) => ({ product, quantity: 1 })));
    clearWishlist();
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-5 sm:py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                aria-label="Back to home"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
              >
                <ArrowLeft size={19} />
              </Link>

              <div className="min-w-0">
                <h1 className="text-[25px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[32px]">
                  My wishlist
                </h1>

                <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                  {hydrated
                    ? `${totalItems} saved ${
                        totalItems === 1
                          ? "product"
                          : "products"
                      }`
                    : "Loading saved products"}
                </p>
              </div>
            </div>

            {hydrated && items.length > 0 && (
              <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={moveAllToCart}
                className="flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 text-xs font-black text-white"
              >
                <ShoppingBag size={15} />
                Add all
              </button>
              <button
                type="button"
                onClick={clearWishlist}
                className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-[var(--danger)] transition hover:bg-red-50"
              >
                <Trash2 size={15} />
                Clear
              </button>
              </div>
            )}
          </div>

          {!hydrated ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-[300px] animate-pulse rounded-[20px] bg-white"
                  />
                )
              )}
            </div>
          ) : items.length === 0 ? (
            <section className="flex min-h-[460px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 py-12 text-center shadow-[var(--shadow-sm)]">
              <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-red-50 text-[var(--danger)]">
                <Heart size={35} />
              </span>

              <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
                Your wishlist is empty
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                Tap the heart icon on any product to save it
                here for later.
              </p>

              <Link
                href="/products"
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 text-sm font-black text-white"
              >
                <ShoppingBag size={18} />
                Browse products
              </Link>
            </section>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
