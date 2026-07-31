"use client";

import ProductCard from "@/components/product/ProductCard";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

type RecentlyViewedProps = {
  currentProductId?: string;
};

export default function RecentlyViewed({
  currentProductId,
}: RecentlyViewedProps) {
  const {
    items,
    hydrated,
    clearRecentlyViewed,
  } = useRecentlyViewed();

  if (!hydrated) return null;

  const visibleItems = items
    .filter((product) => product.id !== currentProductId)
    .slice(0, 8);

  if (visibleItems.length === 0) return null;

  return (
    <section className="py-5 sm:py-7 lg:py-9">
      <Container>
        <div className="mb-4 flex items-end justify-between gap-4">
          <SectionHeading
            title="Recently viewed"
            description="Continue browsing products you checked earlier."
            className="mb-0 flex-1"
          />

          <button
            type="button"
            onClick={clearRecentlyViewed}
            className="shrink-0 rounded-xl px-3 py-2 text-xs font-black text-[var(--danger)] transition hover:bg-red-50"
          >
            Clear
          </button>
        </div>

        <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visibleItems.map((product) => (
            <div
              key={product.id}
              className="w-[174px] shrink-0 snap-start sm:w-auto"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}