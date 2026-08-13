"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BEST_SELLER_CATEGORIES, type ProductCollectionCategory } from "./bestSellerData";
import ProductCollectionBottomSheet from "@/components/product/ProductCollectionBottomSheet";
import type { Product } from "@/types/product";
import { useLocation } from "@/hooks/useLocation";
import { getProducts } from "@/services/product.service";

interface BestSellerGridProps {
  categories?: ProductCollectionCategory[];
  products?: Product[];
}

export default function BestSellerGrid({
  categories: initialCategories,
  products: initialProducts = [],
}: BestSellerGridProps = {}) {
  const categoriesList = useMemo(() => initialCategories ?? BEST_SELLER_CATEGORIES, [initialCategories]);
  const [selectedCategory, setSelectedCategory] = useState(
    (initialCategories ?? BEST_SELLER_CATEGORIES)?.[0]?.title ?? "",
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

      if (!resolvedStoreId || !category.slug) {
        setProducts([]);
        setPopupError(
          !resolvedStoreId
            ? "Delivery store is still being resolved."
            : "This collection is unavailable.",
        );
        return;
      }

      const currentRequestId = ++requestId.current;
      setPopupLoading(true);
      setPopupError(null);

      try {
        const response = await getProducts({
          category: category.slug,
          storeId: resolvedStoreId,
          limit: 100,
        });
        if (currentRequestId === requestId.current) {
          setProducts(response.items as unknown as Product[]);
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

    const category = categoriesList.find((item) => item.title === selectedCategory);
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
          {categoriesList.map((item) => (
            <button
              type="button"
              onClick={() => openPopup(item)}
              key={item.id ?? item.slug ?? item.title}
              className="rounded-2xl border border-[#edf2ee] bg-white p-1 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="grid grid-cols-2 gap-0.5">
                {item.images.filter(Boolean).slice(0, 4).map((image, idx) => (
                  <div
                    key={`${image}-${idx}`}
                    className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-[#F5F8F5] p-0.5"
                  >
                    <Image
                      src={image}
                      alt=""
                      width={70}
                      height={70}
                      className="h-[52px] w-[52px] object-contain"
                    />
                  </div>
                ))}
              </div>

              <p className="mt-3 min-h-[20px] line-clamp-2 text-left text-[11px] font-bold leading-4">
                {item.title}
              </p>
            </button>
          ))}
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
