"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BEST_SELLER_CATEGORIES, type ProductCollectionCategory } from "./bestSellerData";
import ProductCollectionBottomSheet from "@/components/product/ProductCollectionBottomSheet";
import type { Product } from "@/types/product";
import { useLocation } from "@/hooks/useLocation";
import { getCustomerCategoryProducts } from "@/services/customerApi.service";
import { getProducts } from "@/services/product.service";

const DEFAULT_GRID_FALLBACKS = [
  "/images/products/milk.png",
  "/images/products/apple.jpg",
  "/images/products/banana.png",
  "/images/products/potato.png",
];

function SafeGridImage({ src, alt, fallbackSrc }: { src: string; alt: string; fallbackSrc: string }) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="eager"
      decoding="async"
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
      className="h-[52px] w-[52px] object-contain"
    />
  );
}

function getFourPreviewImages(images?: string[]): string[] {
  const valid = (images || []).filter((img) => typeof img === "string" && img.trim() !== "");
  if (valid.length === 0) {
    return DEFAULT_GRID_FALLBACKS;
  }
  const result = [...valid];
  let idx = 0;
  while (result.length < 4) {
    result.push(valid[idx % valid.length] || DEFAULT_GRID_FALLBACKS[idx % DEFAULT_GRID_FALLBACKS.length]);
    idx++;
  }
  return result.slice(0, 4);
}

interface BestSellerGridProps {
  categories?: ProductCollectionCategory[];
  products?: Product[];
}

export default function BestSellerGrid({
  categories: initialCategories,
  products: initialProducts = [],
}: BestSellerGridProps = {}) {
  const categoriesList = useMemo(() => initialCategories ?? [], [initialCategories]);
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategories?.[0]?.title ?? "",
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const { resolvedStoreId } = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    setSelectedCategory(initialCategories?.[0]?.title ?? "");
  }, [initialCategories]);

  const loadCategoryProducts = useCallback(
    async (category: ProductCollectionCategory) => {
      if (initialProducts.length > 0) return;

      if (!category.slug) {
        setProducts([]);
        setPopupError("This collection is unavailable.");
        return;
      }

      const currentRequestId = ++requestId.current;
      setPopupLoading(true);
      setPopupError(null);

      try {
        let loadedItems: Product[] = [];
        try {
          const catRes = await getCustomerCategoryProducts(category.slug, {
            storeId: resolvedStoreId || undefined,
            limit: 100,
          });
          if (catRes && (catRes.products || catRes.items)) {
            loadedItems = (catRes.products || catRes.items) as unknown as Product[];
          }
        } catch {
          // fallback to getProducts
        }

        if (loadedItems.length === 0) {
          const response = await getProducts({
            category: category.slug,
            storeId: resolvedStoreId || undefined,
            limit: 100,
          });
          loadedItems = (response.items || []) as unknown as Product[];
        }

        if (currentRequestId === requestId.current) {
          setProducts(loadedItems);
        }
      } catch (error) {
        if (currentRequestId === requestId.current) {
          console.error("Failed to load Best Sellers products:", error);
          setProducts([]);
          setPopupError("Products could not be loaded. Please try again.");
        }
      } finally {
        if (currentRequestId === requestId.current) setPopupLoading(false);
      }
    },
    [initialProducts.length, resolvedStoreId],
  );

  useEffect(() => {
    if (!popupOpen) {
      requestId.current += 1;
      return;
    }

    const category = categoriesList.find((item) => item.title === selectedCategory || item.slug === selectedCategory);
    if (category) void loadCategoryProducts(category);
  }, [categoriesList, loadCategoryProducts, popupOpen, selectedCategory]);

  const openPopup = (category: ProductCollectionCategory) => {
    if (!category.slug && initialProducts.length === 0) {
      console.warn("[CustomerHome] Best Sellers category is missing a slug.", category);
      return;
    }
    setSelectedCategory(category.title);
    setPopupOpen(true);
  };

  if (categoriesList.length === 0) {
    return null;
  }

  return (
    <>
      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Best Sellers</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {categoriesList.map((item) => {
            const previewImages = getFourPreviewImages(item.images);
            return (
              <button
                type="button"
                onClick={() => openPopup(item)}
                key={item.id ?? item.slug ?? item.title}
                className="rounded-2xl border border-[#edf2ee] bg-white p-1 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="grid grid-cols-2 gap-0.5">
                  {previewImages.map((image, idx) => (
                    <div
                      key={`${image}-${idx}`}
                      className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-[#F5F8F5] p-0.5"
                    >
                      <SafeGridImage
                        src={image}
                        alt=""
                        fallbackSrc={DEFAULT_GRID_FALLBACKS[idx % DEFAULT_GRID_FALLBACKS.length]}
                      />
                    </div>
                  ))}
                </div>

                <p className="mt-3 min-h-[20px] line-clamp-2 text-left text-[11px] font-bold leading-4">
                  {item.title}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <ProductCollectionBottomSheet
        open={popupOpen}
        title="Best Sellers"
        products={initialProducts.length > 0 ? initialProducts : products}
        categories={categoriesList}
        initialCategory={selectedCategory}
        loading={popupLoading}
        error={popupError}
        onCategoryChange={(category) => setSelectedCategory(category.title)}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}
