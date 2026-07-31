"use client";

import { FormEvent, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = query.trim();

    if (!value) return;

    router.push(`/search?q=${encodeURIComponent(value)}`);
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
    </form>
  );
}