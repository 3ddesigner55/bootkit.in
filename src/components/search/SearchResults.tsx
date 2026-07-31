"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/product/ProductCard";
import Container from "@/components/ui/Container";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminProducts } from "@/hooks/useAdminProducts";

type SortOption =
  | "relevance"
  | "price-low"
  | "price-high"
  | "rating"
  | "discount";

const sortOptions: Array<{
  label: string;
  value: SortOption;
}> = [
  {
    label: "Relevance",
    value: "relevance",
  },
  {
    label: "Price: Low to High",
    value: "price-low",
  },
  {
    label: "Price: High to Low",
    value: "price-high",
  },
  {
    label: "Top Rated",
    value: "rating",
  },
  {
    label: "Best Discount",
    value: "discount",
  },
];

export default function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQuery = searchParams.get("q")?.trim() ?? "";

  const [inputValue, setInputValue] = useState(currentQuery);
  const [sortBy, setSortBy] =
    useState<SortOption>("relevance");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [minimumRating, setMinimumRating] = useState("0");
  const [inStockOnly, setInStockOnly] = useState(false);

  const {
  activeProducts: products,
  hydrated,
} = useAdminProducts();
  const {
  activeCategories: categories,
} = useAdminCategories();

  const normalizedQuery = currentQuery.toLowerCase();
  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brand))].sort(),
    [products]
  );

  const matchedCategories = useMemo(() => {
    if (!normalizedQuery) return [];

    return categories.filter((category) =>
      [
        category.name,
        category.description,
        category.slug,
      ].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [categories, normalizedQuery]);

  const filteredProducts = useMemo(() => {
    const matchingProducts = normalizedQuery
      ? products.filter((product) =>
          [
            product.name,
            product.brand,
            product.categorySlug,
            product.unit.label,
          ].some((value) =>
            value.toLowerCase().includes(normalizedQuery)
          )
        )
      : products;

    const filtered = matchingProducts.filter((product) => {
      if (categoryFilter !== "all" && product.categorySlug !== categoryFilter) return false;
      if (brandFilter !== "all" && product.brand !== brandFilter) return false;
      if (maxPrice && product.price > Number(maxPrice)) return false;
      if (product.rating < Number(minimumRating)) return false;
      if (inStockOnly && product.stock <= 0) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-low") {
        return a.price - b.price;
      }

      if (sortBy === "price-high") {
        return b.price - a.price;
      }

      if (sortBy === "rating") {
        return b.rating - a.rating;
      }

      if (sortBy === "discount") {
        const discountA =
          ((a.mrp - a.price) / a.mrp) * 100;

        const discountB =
          ((b.mrp - b.price) / b.mrp) * 100;

        return discountB - discountA;
      }

      if (normalizedQuery) {
        const aExact =
          a.name.toLowerCase().startsWith(normalizedQuery)
            ? 1
            : 0;

        const bExact =
          b.name.toLowerCase().startsWith(normalizedQuery)
            ? 1
            : 0;

        if (aExact !== bExact) {
          return bExact - aExact;
        }
      }

      return Number(b.bestseller) - Number(a.bestseller);
    });
  }, [products, normalizedQuery, sortBy, categoryFilter, brandFilter, maxPrice, minimumRating, inStockOnly]);

  const resetFilters = () => {
    setCategoryFilter("all");
    setBrandFilter("all");
    setMaxPrice("");
    setMinimumRating("0");
    setInStockOnly(false);
  };

  const activeFilterCount = [categoryFilter !== "all", brandFilter !== "all", Boolean(maxPrice), minimumRating !== "0", inStockOnly].filter(Boolean).length;

  const submitSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const value = inputValue.trim();

    if (!value) {
      router.push("/search");
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(value)}`
    );
  };

  const clearSearch = () => {
    setInputValue("");
    router.push("/search");
  };

  if (!hydrated) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="h-[52px] animate-pulse rounded-2xl bg-white" />

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
        <Container className="py-4 sm:py-8">
          <div className="mb-5 flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div className="min-w-0">
              <h1 className="text-[23px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[31px]">
                Search products
              </h1>

              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Find groceries and local essentials
              </p>
            </div>
          </div>

          <form
            onSubmit={submitSearch}
            className="flex h-[52px] items-center overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)] focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-green-900/10"
          >
            <button
              type="submit"
              aria-label="Search"
              className="flex h-full w-12 shrink-0 items-center justify-center text-[var(--primary)]"
            >
              <Search size={20} />
            </button>

            <input
              value={inputValue}
              onChange={(event) =>
                setInputValue(event.target.value)
              }
              placeholder="Search milk, fruits, snacks..."
              autoFocus
              className="h-full min-w-0 flex-1 bg-transparent pr-2 text-sm font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
            />

            {inputValue && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)]"
              >
                <X size={16} />
              </button>
            )}
          </form>

          {!currentQuery && (
            <section className="mt-5 rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
              <h2 className="text-base font-black text-[var(--text-primary)]">
                Popular searches
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Milk",
                  "Banana",
                  "Bread",
                  "Rice",
                  "Juice",
                  "Snacks",
                  "Floor Cleaner",
                ].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setInputValue(term);
                      router.push(
                        `/search?q=${encodeURIComponent(term)}`
                      );
                    }}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] transition active:border-[var(--primary)] active:text-[var(--primary)]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-[var(--text-primary)]">Filters</h2>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Category, brand, price, rating और availability</p>
              </div>
              {activeFilterCount > 0 && <button type="button" onClick={resetFilters} className="text-xs font-black text-[var(--primary)]">Clear {activeFilterCount}</button>}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="block"><span className="mb-1 block text-[10px] font-bold text-[var(--text-muted)]">Category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-bold"><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label>
              <label className="block"><span className="mb-1 block text-[10px] font-bold text-[var(--text-muted)]">Brand</span><select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-bold"><option value="all">All brands</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></label>
              <label className="block"><span className="mb-1 block text-[10px] font-bold text-[var(--text-muted)]">Maximum price</span><input value={maxPrice} inputMode="numeric" onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ""))} placeholder="Any price" className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-xs font-bold" /></label>
              <label className="block"><span className="mb-1 block text-[10px] font-bold text-[var(--text-muted)]">Minimum rating</span><select value={minimumRating} onChange={(event) => setMinimumRating(event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-bold"><option value="0">Any rating</option><option value="4">4★ & above</option><option value="4.5">4.5★ & above</option></select></label>
              <label className="mt-5 flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-xs font-bold"><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} />In stock only</label>
            </div>
          </section>

          {currentQuery && matchedCategories.length > 0 && (
            <section className="mt-6">
              <h2 className="text-base font-black text-[var(--text-primary)]">
                Matching categories
              </h2>

              <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                {matchedCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="flex w-[180px] shrink-0 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-xs)]"
                  >
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[26px]"
                      style={{
                        backgroundColor:
                          category.background,
                      }}
                    >
                      {category.icon}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-xs font-black leading-4 text-[var(--text-primary)]">
                        {category.name}
                      </span>

                      <span className="mt-1 block text-[9px] font-semibold text-[var(--text-muted)]">
                        {category.productCount} products
                      </span>
                    </span>

                    <ChevronRight
                      size={15}
                      className="shrink-0 text-[var(--primary)]"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[20px] font-black tracking-[-0.035em] text-[var(--text-primary)] sm:text-[26px]">
                  {currentQuery
                    ? `Results for “${currentQuery}”`
                    : "All available products"}
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "product"
                    : "products"}{" "}
                  found
                </p>
              </div>

              <label className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3">
                <SlidersHorizontal
                  size={15}
                  className="text-[var(--primary)]"
                />

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as SortOption
                    )
                  }
                  aria-label="Sort products"
                  className="max-w-[120px] bg-transparent text-[11px] font-bold text-[var(--text-primary)] outline-none sm:max-w-none"
                >
                  {sortOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[26px] border border-dashed border-[var(--border-strong)] bg-white px-5 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--surface-soft)] text-[var(--text-muted)]">
                  <Search size={34} />
                </span>

                <h3 className="mt-5 text-xl font-black text-[var(--text-primary)]">
                  No matching products
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
                  Try another product name, brand or category.
                </p>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-5 rounded-xl bg-[var(--primary)] px-5 py-3 text-xs font-black text-white"
                >
                  View all products
                </button>
              </div>
            )}
          </section>
        </Container>
      </main>
    </div>
  );
}
