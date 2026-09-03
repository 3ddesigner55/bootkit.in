"use client";

import Image from "next/image";
import { Mic, Search } from "lucide-react";
import { useEffect, useRef } from "react";

import type { Product } from "@/types/product";

type HomeSearchProps = {
  searchQuery: string;
  filteredProducts: Product[];
  onSearchQueryChange: (value: string) => void;
  onProductSelect: (product: Product) => void;
  onClose: () => void;
};

function getProductImage(product: Product) {
  const galleryImage = product.images?.find(
    (image) => typeof image === "string" && image.trim() !== ""
  );

  if (galleryImage) {
    return galleryImage;
  }

  return typeof product.image === "string" && product.image.trim() !== ""
    ? product.image
    : null;
}

export default function HomeSearch({
  searchQuery,
  filteredProducts,
  onSearchQueryChange,
  onProductSelect,
  onClose,
}: HomeSearchProps) {
  const searchRef = useRef<HTMLDivElement>(null);
  const showDropdown = searchQuery.trim() !== "";

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !searchRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div ref={searchRef} className="relative mt-5">
      <div className="flex h-[58px] items-center gap-3 rounded-[20px] border border-[#e6efe8] bg-white px-4 shadow-[0_8px_25px_rgba(0,0,0,.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,.08)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F8F5]">
          <Search size={18} className="text-[var(--primary)]" />
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search groceries, fruits, milk..."
          className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />

        <button
          type="button"
          aria-label="Voice search"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] transition hover:scale-105"
        >
          <Mic size={18} className="text-[var(--primary)]" />
        </button>
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[440px] overflow-y-auto rounded-2xl bg-white p-2 shadow-[0_16px_40px_rgba(20,51,31,0.16)] transition-opacity duration-200">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const image = getProductImage(product);

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onProductSelect(product)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#F5F8F5]"
                >
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F5F8F5]">
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <span className="text-2xl">{product.fallbackIcon}</span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-[var(--text-primary)]">
                      {product.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--text-muted)]">
                      {product.brand}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-6 text-center text-sm font-semibold text-[var(--text-muted)]">
              No products found
            </p>
          )}

          {filteredProducts.length > 0 ? (
            <p className="border-t border-[#EEF2EF] px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)]">
              Showing results for &quot;{searchQuery}&quot;
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
