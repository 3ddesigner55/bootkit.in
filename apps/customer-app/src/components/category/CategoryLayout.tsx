"use client";

import { useEffect, useState } from "react";

import CategorySidebar from "./CategorySidebar";
import CategoryProductGrid from "./CategoryProductGrid";
import CategoryFilters from "./CategoryFilters";
import { getCustomerCategoryProducts } from "@/services/customerApi.service";
import { useLocation } from "@/hooks/useLocation";
import type { SelectedFilters } from "./filterData";

interface CategoryLayoutProps {
  slug: string;
}

function getSortParam(sortLabel: string): string {
  if (sortLabel.includes("Price Low → High")) return "price-asc";
  if (sortLabel.includes("Price High → Low")) return "price-desc";
  if (sortLabel.includes("Name")) return "name-asc";
  return "display-order";
}

export default function CategoryLayout({ slug }: CategoryLayoutProps) {
  const { resolvedStoreId } = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(slug);
  const [products, setProducts] = useState<any[]>([]);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState<string>("Relevance");
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const sortParam = getSortParam(selectedSort);
    const brand = selectedFilters.brand?.[0];

    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    if (selectedFilters.price?.[0]) {
      const priceVal = selectedFilters.price[0];
      if (priceVal.includes("100") && priceVal.includes("250")) {
        minPrice = 100;
        maxPrice = 250;
      } else if (priceVal.includes("250") && priceVal.includes("500")) {
        minPrice = 250;
        maxPrice = 500;
      } else if (priceVal.includes("500")) {
        minPrice = 500;
      } else if (priceVal.includes("100")) {
        minPrice = 0;
        maxPrice = 100;
      }
    }

    void getCustomerCategoryProducts(selectedCategory, {
      storeId: resolvedStoreId || undefined,
      brand,
      minPrice,
      maxPrice,
      sort: sortParam,
      page: 1,
      limit: 100,
    })
      .then((res) => {
        if (!cancelled) {
          setSiblings(res.siblings || []);
          setProducts(res.products || []);
        }
      })
      .catch((err) => {
        console.error("Error fetching category products:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, resolvedStoreId, selectedSort, selectedFilters]);

  return (
    <section className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#F5F7F5]">
      {/* LEFT */}
      <div className="h-full w-[90px] shrink-0">
        <CategorySidebar
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          categories={siblings}
        />
      </div>

      {/* RIGHT */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Filters */}
        <CategoryFilters
          onSortChange={setSelectedSort}
          onFiltersChange={setSelectedFilters}
        />

        {/* Products */}
        <CategoryProductGrid products={products} loading={loading} />
      </div>
    </section>
  );
}
