"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { formatPrice } from "@/lib/utils";

type SearchBarProps = {
  className?: string;
  placeholder?: string;
  compact?: boolean;
};

export default function SearchBar({
  className,
  placeholder = "Search groceries, vegetables, snacks and more",
  compact = false,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { activeProducts } = useAdminProducts();
  const suggestions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return activeProducts.filter((product) => `${product.name} ${product.brand} ${product.categorySlug}`.toLowerCase().includes(value)).slice(0, 6);
  }, [activeProducts, query]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = query.trim();

    if (!value) return;

    if (suggestions[0]) router.push(`/product/${suggestions[0].slug}`);
  };

  return (
    <form
      role="search"
      onSubmit={submitSearch}
      className={cn(
        "group relative flex w-full items-center rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-xs)] transition",
        "focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_3px_rgba(22,92,58,0.10)]",
        compact ? "h-11" : "h-12 lg:h-[52px]",
        className
      )}
    >
      <button
        type="submit"
        aria-label="Search products"
        className="flex h-full shrink-0 items-center justify-center pl-4 pr-3 text-[var(--text-muted)] transition hover:text-[var(--primary)]"
      >
        <Search size={compact ? 19 : 21} strokeWidth={2.1} />
      </button>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-full min-w-0 flex-1 bg-transparent pr-3 text-[14px] font-medium text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
      />

      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
        >
          <X size={17} />
        </button>
      )}

      {query.trim() && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[80] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
          {suggestions.length ? suggestions.map((product) => <Link key={product.id} href={`/product/${product.slug}`} onClick={() => setQuery("")} className="flex items-center gap-3 border-b border-[var(--border)] px-3 py-3 last:border-b-0 hover:bg-[var(--surface-soft)]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-xl">{product.fallbackIcon}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-black text-[var(--text-primary)]">{product.name}</span><span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{product.unit.label} · {product.brand}</span></span><span className="text-xs font-black text-[var(--primary)]">{formatPrice(product.price)}</span></Link>) : <p className="px-4 py-4 text-center text-xs font-bold text-[var(--text-muted)]">No matching items found.</p>}
        </div>
      )}
    </form>
  );
}
