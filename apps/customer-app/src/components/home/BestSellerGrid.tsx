"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { BEST_SELLER_CATEGORIES, type ProductCollectionCategory } from "./bestSellerData";
import ProductCollectionBottomSheet from "@/components/product/ProductCollectionBottomSheet";
import { getHome } from "@/services/home.service";
import type { Product } from "@/types/product";

interface BestSellerGridProps {
  categories?: ProductCollectionCategory[];
  products?: Product[];
}

export default function BestSellerGrid({
  categories: initialCategories,
  products: initialProducts = [],
}: BestSellerGridProps = {}) {
  const isDynamicMode = initialCategories !== undefined;
  const [categoriesList, setCategoriesList] = useState<ProductCollectionCategory[] | null>(
    initialCategories || null,
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategories && initialCategories.length > 0 ? initialCategories[0].title : "",
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const [loading, setLoading] = useState(!isDynamicMode);

  useEffect(() => {
    if (isDynamicMode) {
      setCategoriesList(initialCategories || []);
      if (initialCategories && initialCategories.length > 0) {
        setSelectedCategory(initialCategories[0].title);
      }
      setLoading(false);
      return;
    }

    getHome()
      .then((data) => {
        if (data.bestSellers) {
          const resolved = data.bestSellers.map((item) => ({
            title: item.name,
            count: item.count,
            images: item.images,
            matches: (product: any) =>
              (product.categorySlug || product.category?.slug) === item.slug,
          }));
          setCategoriesList(resolved);
          if (resolved.length > 0) {
            setSelectedCategory(resolved[0].title);
          }
        } else {
          setCategoriesList([]);
        }
      })
      .catch(() => {
        setCategoriesList(BEST_SELLER_CATEGORIES);
        if (BEST_SELLER_CATEGORIES.length > 0) {
          setSelectedCategory(BEST_SELLER_CATEGORIES[0].title);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialCategories, isDynamicMode]);

  const openPopup = (categoryTitle: string) => {
    setSelectedCategory(categoryTitle);
    setPopupOpen(true);
  };

  if (loading) {
    return null;
  }

  if (!categoriesList || categoriesList.length === 0) {
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
              onClick={() => openPopup(item.title)}
              key={item.title}
              className="rounded-2xl border border-[#edf2ee] bg-white p-1 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="grid grid-cols-2 gap-0.5">
                {item.images.slice(0, 4).map((image, idx) => (
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
        products={initialProducts as any}
        categories={categoriesList}
        initialCategory={selectedCategory}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}
