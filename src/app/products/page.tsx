"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ShoppingBasket,
} from "lucide-react";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/product/ProductCard";
import Container from "@/components/ui/Container";
import { useAdminProducts } from "@/hooks/useAdminProducts";

export default function ProductsPage() {
  const {
    activeProducts,
    hydrated,
  } = useAdminProducts();

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <main>
          <Container className="py-5 sm:py-8">
            <div className="mb-6 h-16 animate-pulse rounded-2xl bg-white" />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[300px] animate-pulse rounded-[20px] bg-white"
                />
              ))}
            </div>
          </Container>
        </main>
      </div>
    );
  }

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
                  All products
                </h1>

                <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                  {activeProducts.length} products currently available
                </p>
              </div>
            </div>

            <Link
              href="/search"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--primary)]"
              aria-label="Search products"
            >
              <Search size={18} />
            </Link>
          </div>

          <section className="mb-6 flex items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--primary-light)] p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary)] text-white">
              <ShoppingBasket size={21} />
            </span>

            <div>
              <h2 className="text-sm font-black text-[var(--text-primary)]">
                BootKiT local inventory
              </h2>

              <p className="mt-0.5 text-[11px] leading-5 text-[var(--text-secondary)]">
                Product availability may depend on your selected delivery area.
              </p>
            </div>
          </section>

          {activeProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {activeProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-[26px] border border-dashed border-[var(--border-strong)] bg-white text-sm font-bold text-[var(--text-muted)]">
              No active products available.
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}