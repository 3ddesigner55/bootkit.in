"use client";

import Image from "next/image";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Product } from "@/types/product";
import type { ProductCollectionCategory } from "@/components/home/bestSellerData";

import ProductCard from "./ProductCard";

type ProductCollectionBottomSheetProps = {
  open: boolean;
  title: string;
  products: Product[];
  categories: ProductCollectionCategory[];
  initialCategory: string;
  showSearch?: boolean;
  onClose: () => void;
};

export default function ProductCollectionBottomSheet({
  open,
  title,
  products,
  categories,
  initialCategory,
  showSearch = false,
  onClose,
}: ProductCollectionBottomSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClosing, setIsClosing] = useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedCategory(initialCategory);
    setSearchQuery("");
    setIsClosing(true);

    const animationFrame = window.requestAnimationFrame(() => {
      setIsClosing(false);
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.body.style.overflow = previousOverflow;
    };
  }, [initialCategory, open]);

  const selectedProducts = useMemo(() => {
    const category = categories.find((item) => item.title === selectedCategory);
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase();

    return products.filter((product) => {
      const matchesCategory = category?.matches(product) ?? false;
      const matchesSearch =
        normalizedSearch === "" ||
        product.name.toLocaleLowerCase().includes(normalizedSearch) ||
        product.brand.toLocaleLowerCase().includes(normalizedSearch);

      return product.active && matchesCategory && matchesSearch;
    });
  }, [categories, products, searchQuery, selectedCategory]);

  if (!open) {
    return null;
  }

  const closeSheet = () => {
    setIsClosing(true);
    window.setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`mx-auto mt-16 flex h-[calc(100%-4rem)] max-w-md flex-col bg-[#F8FAF8] transition-transform duration-300 ${
          isClosing ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div
          className={`relative shrink-0 rounded-t-[24px] bg-[#F8FAF8] ${
            showSearch ? "h-[104px]" : "h-[52px]"
          }`}
        >
          <button
            type="button"
            onClick={closeSheet}
            aria-label={`Close ${title}`}
            className="absolute left-1/2 -top-12 z-50 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <X size={20} />
          </button>

          <h2
            className={`absolute text-lg font-black text-[var(--text-primary)] ${
              showSearch
                ? "left-4 top-3"
                : "bottom-3 left-20 -translate-x-1/2"
            }`}
          >
            {title}
          </h2>

          {showSearch ? (
            <label className="absolute bottom-3 left-4 right-4 flex h-10 items-center gap-2 rounded-xl border border-[#E5ECE6] bg-white px-3 shadow-sm">
              <Search size={16} className="text-[var(--text-muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products"
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </label>
          ) : null}

          <div className="absolute bottom-0 left-4 right-4 h-px bg-[#E5ECE6]" />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[96px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-r border-[#E5ECE6] bg-white px-2 py-3">
            <div className="space-y-2">
              {categories.map((category) => {
                const selected = selectedCategory === category.title;

                return (
                  <button
                    type="button"
                    key={category.title}
                    onClick={() => setSelectedCategory(category.title)}
                    className={`flex w-full flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition ${
                      selected
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "text-[var(--text-primary)] hover:bg-[#F5F8F5]"
                    }`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F8F5] p-1">
                      <Image
                        src={category.images[0]}
                        alt=""
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </span>
                    <span className="line-clamp-2 text-[10px] font-black leading-3">
                      {category.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="overflow-y-auto px-3 py-4">
            <h3 className="mb-4 text-base font-black text-[var(--text-primary)]">
              {selectedCategory}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="bestSellerPopup"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
