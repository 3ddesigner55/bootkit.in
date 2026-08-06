"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { BEST_SELLER_CATEGORIES } from "./bestSellerData";
import ProductCollectionBottomSheet from "@/components/product/ProductCollectionBottomSheet";
import { products } from "@/data/products";

export default function BestSellerGrid() {
  const [selectedCategory, setSelectedCategory] = useState(
    BEST_SELLER_CATEGORIES[0].title
  );
  const [popupOpen, setPopupOpen] = useState(false);

  const openPopup = (categoryTitle: string) => {
    setSelectedCategory(categoryTitle);
    setPopupOpen(true);
  };

  return (
    <>
      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Best Sellers</h2>
          <Link
            href="/categories"
            className="text-sm font-semibold text-[var(--primary)]"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {BEST_SELLER_CATEGORIES.map((item) => (
            <button
              type="button"
              onClick={() => openPopup(item.title)}
              key={item.title}
              className="rounded-2xl border border-[#edf2ee] bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="grid grid-cols-2 gap-2">
                {item.images.map((image) => (
                  <div
                    key={image}
                    className="flex aspect-square items-center justify-center rounded-xl bg-[#F5F8F5] p-1"
                  >
                    <Image
                      src={image}
                      alt=""
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>

              <p className="mt-3 text-[13px] font-bold">{item.title}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {item.count}
                </span>
                <span className="font-bold text-[var(--primary)]">→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <ProductCollectionBottomSheet
        open={popupOpen}
        title="Best Sellers"
        products={products}
        categories={BEST_SELLER_CATEGORIES}
        initialCategory={selectedCategory}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}
