"use client";

import { useAdminCategories } from "@/hooks/useAdminCategories";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Grid2X2,
  Search,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";


export default function CategoriesPage() {
  const {
  activeCategories: categories,
  hydrated,
} = useAdminCategories();

if (!hydrated) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <Container className="py-8">
        <div className="h-[500px] animate-pulse rounded-3xl bg-white" />
      </Container>
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--primary)]"
              >
                <ArrowLeft size={19} />
              </Link>

              <div className="min-w-0">
                <h1 className="text-[25px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[32px]">
                  All categories
                </h1>

                <p className="mt-0.5 text-xs text-[var(--text-muted)] sm:text-sm">
                  Browse groceries and everyday essentials
                </p>
              </div>
            </div>

            <Link
              href="/search"
              aria-label="Search products"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <Search size={18} />
            </Link>
          </div>

          <section className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
                <Grid2X2 size={19} />
              </span>

              <div>
                <h2 className="text-base font-black text-[var(--text-primary)]">
                  Shop by department
                </h2>

                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {categories.length} active categories
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:p-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group flex min-h-[190px] flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-white p-3 transition duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
                >
                  <div
                    className="flex aspect-[1.25/1] items-center justify-center rounded-[16px] text-[48px] transition duration-300 group-hover:scale-[1.02]"
                    style={{
                      backgroundColor: category.background,
                    }}
                    aria-hidden="true"
                  >
                    {category.icon}
                  </div>

                  <div className="mt-3 flex flex-1 flex-col">
                    <h3 className="line-clamp-2 text-[13px] font-black leading-5 text-[var(--text-primary)] sm:text-sm">
                      {category.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[var(--text-muted)]">
                      {category.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <span className="text-[10px] font-bold text-[var(--primary)]">
                        {category.productCount} products
                      </span>

                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}