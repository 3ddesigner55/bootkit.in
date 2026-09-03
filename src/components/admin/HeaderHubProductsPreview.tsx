"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Loader2,
  Package,
  Search,
} from "lucide-react";

import { getCustomerCatalogProducts } from "@/services/customerApi.service";
import type { CustomerProduct } from "@/services/customerApi.types";

type CollectionHub =
  | "beauty"
  | "electronics"
  | "pharmacy"
  | "decor"
  | "kids"
  | "gifting";

export default function HeaderHubProductsPreview({
  hub,
}: {
  hub: CollectionHub;
}) {
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setQuery("");

    void getCustomerCatalogProducts({
      hub,
      page: 1,
      limit: 100,
    })
      .then((result) => {
        if (!cancelled) {
          setProducts(result.items);
          setTotal(result.pagination.total);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load products.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hub]);

  const filteredProducts = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return products;

    return products.filter((product) =>
      [
        product.name,
        product.slug,
        product.brandName,
        product.categoryName,
      ].some(
        (field) =>
          typeof field === "string" &&
          field.toLowerCase().includes(value),
      ),
    );
  }, [products, query]);

  return (
    <section className="mt-6 flex h-[calc(100dvh-50px)] min-h-0 flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-5">
      <div className="shrink-0">
        <h2 className="text-lg font-black">
          Products Preview
        </h2>

        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {total} active products automatically connected with {hub}
          categories.
        </p>
      </div>

      <label className="mt-4 flex h-11 shrink-0 items-center gap-3 rounded-xl border border-[var(--border)] px-4">
        <Search
          size={17}
          className="text-[var(--text-muted)]"
        />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search connected product"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      {error ? (
        <p className="mt-3 text-xs font-bold text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
  {loading ? (
    <div className="flex h-full min-h-48 items-center justify-center">
      <Loader2
        size={22}
        className="animate-spin text-[var(--primary)]"
      />
    </div>
  ) : (
    <div className="grid content-start grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {filteredProducts.map((product) => (
        <article
          key={product.id}
          className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-white"
        >
          <div className="relative flex h-28 items-center justify-center overflow-hidden bg-[var(--surface-soft)]">
            <Package
              size={24}
              className="absolute text-[var(--text-muted)]"
            />

            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                className="relative z-10 h-full w-full bg-[var(--surface-soft)] object-contain p-2"
              />
            ) : null}
          </div>

          <div className="p-2.5">
            <h3 className="line-clamp-2 min-h-8 text-[11px] font-black leading-4">
              {product.name}
            </h3>

            <p className="mt-1 truncate text-[9px] text-[var(--text-muted)]">
              {product.categoryName || product.category?.name}
            </p>

            <div className="mt-2 flex items-center justify-between gap-1">
              <span className="text-[11px] font-black text-[var(--primary)]">
                ₹{product.sellingPrice.toLocaleString("en-IN")}
              </span>

              <span className="text-[8px] font-bold text-[var(--text-muted)]">
                Stock {product.availableStock ?? product.stock}
              </span>
            </div>
          </div>
        </article>
      ))}

      {!filteredProducts.length ? (
        <div className="col-span-full py-12 text-center">
          <Package
            size={30}
            className="mx-auto text-[var(--text-muted)]"
          />

          <p className="mt-3 text-sm font-bold">
            No connected products
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            ऐसी category select करो जिसमें active products मौजूद हों।
          </p>
        </div>
      ) : null}
    </div>
  )}
</div>
    </section>
  );
}