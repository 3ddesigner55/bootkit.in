"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Grid2X2,
  Search,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import ProductCard from "@/components/product/ProductCard";
import {
  getActiveCategories,
  getCategoryBySlug,
} from "@/data/categories";
import { useAdminProducts } from "@/hooks/useAdminProducts";

export default function CategoryProductsPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug);

  const category = getCategoryBySlug(slug);

  const {
  activeProducts,
  hydrated,
} = useAdminProducts();

const products = activeProducts.filter(
  (product) => product.categorySlug === slug
);

  const otherCategories = getActiveCategories()
    .filter((item) => item.slug !== slug)
    .slice(0, 6);

    if (!hydrated) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <Container className="py-5 sm:py-8">
        <div className="h-48 animate-pulse rounded-[26px] bg-white" />

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-[300px] animate-pulse rounded-[20px] bg-white"
            />
          ))}
        </div>
      </Container>
    </div>
  );
}

  if (!category) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />

        <Container className="py-8">
          <section className="flex min-h-[440px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center shadow-[var(--shadow-sm)]">
            <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--primary-light)] text-[var(--primary)]">
              <Grid2X2 size={34} />
            </span>

            <h1 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
              Category not found
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              This category may be inactive or does not exist.
            </p>

            <Link
              href="/categories"
              className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-6 text-sm font-bold text-white"
            >
              View all categories
            </Link>
          </section>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-5 sm:py-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-1.5 overflow-hidden text-[11px] font-semibold text-[var(--text-muted)]"
          >
            <Link
              href="/"
              className="shrink-0 transition hover:text-[var(--primary)]"
            >
              Home
            </Link>

            <ChevronRight size={13} className="shrink-0" />

            <Link
              href="/categories"
              className="shrink-0 transition hover:text-[var(--primary)]"
            >
              Categories
            </Link>

            <ChevronRight size={13} className="shrink-0" />

            <span className="truncate text-[var(--text-primary)]">
              {category.name}
            </span>
          </nav>

          <section
            className="relative overflow-hidden rounded-[26px] border border-[var(--border)] px-5 py-7 shadow-[var(--shadow-sm)] sm:px-8 sm:py-9"
            style={{
              backgroundColor: category.background,
            }}
          >
            <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/50 blur-2xl" />

            <div className="relative flex items-center justify-between gap-5">
              <div className="min-w-0">
                <Link
                  href="/categories"
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] transition hover:gap-2"
                >
                  <ArrowLeft size={15} />
                  All categories
                </Link>

                <h1 className="max-w-3xl text-[29px] font-black leading-tight tracking-[-0.045em] text-[var(--text-primary)] sm:text-[40px]">
                  {category.name}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                  {category.description}
                </p>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-[var(--primary)]">
                  {products.length} currently available
                </p>
              </div>

              <span
                className="hidden h-28 w-28 shrink-0 items-center justify-center rounded-[26px] border border-white/70 bg-white/55 text-[64px] shadow-[var(--shadow-sm)] sm:flex"
                aria-hidden="true"
              >
                {category.icon}
              </span>
            </div>
          </section>

          <section className="py-7">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[21px] font-black tracking-[-0.035em] text-[var(--text-primary)] sm:text-[27px]">
                  Available products
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
                  Order from nearby BootKiT inventory
                </p>
              </div>

              <Link
                href={`/search?q=${encodeURIComponent(category.name)}`}
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--primary)] transition hover:border-[var(--primary)]"
              >
                <Search size={15} />
                Search
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border-strong)] bg-white px-5 text-center">
                <span className="text-[52px]" aria-hidden="true">
                  {category.icon}
                </span>

                <h3 className="mt-4 text-lg font-black text-[var(--text-primary)]">
                  Products coming soon
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                  This category is active, but products have not yet been
                  added to the local inventory.
                </p>
              </div>
            )}
          </section>

          <section className="pb-5">
            <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--text-primary)]">
              Explore other categories
            </h2>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {otherCategories.map((item) => (
                <Link
                  key={item.id}
                  href={`/category/${item.slug}`}
                  className="flex w-[150px] shrink-0 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 transition hover:border-[var(--primary)]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[25px]"
                    style={{
                      backgroundColor: item.background,
                    }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  <span className="line-clamp-2 text-xs font-black leading-4 text-[var(--text-primary)]">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}