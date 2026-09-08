"use client";

import { useEffect, useState } from "react";

import { BEST_SELLER_CATEGORIES, type ProductCollectionCategory } from "./bestSellerData";
import ProductCollectionBottomSheet from "@/components/product/ProductCollectionBottomSheet";
import { getHome } from "@/services/home.service";
import type { Product } from "@/types/product";

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
        if (data.bestSellers && data.bestSellers.length > 0) {
          const resolved = data.bestSellers.map((item) => ({
            title: item.name,
            count: item.count,
            images: getFourPreviewImages(item.images),
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
        setCategoriesList([]);
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
          {categoriesList.map((item) => {
            const previewImages = getFourPreviewImages(item.images);
            return (
              <button
                type="button"
                onClick={() => openPopup(item.title)}
                key={item.title}
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
        products={initialProducts as any}
        categories={categoriesList}
        initialCategory={selectedCategory}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}
