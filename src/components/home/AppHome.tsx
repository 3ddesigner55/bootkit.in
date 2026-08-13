"use client";

import { useEffect, useRef, useState } from "react";
import ProductDrawer from "@/components/product/ProductDrawer";
import { searchProducts } from "@/services/search.service";
import { getHome } from "@/services/home.service";
import { useLocation } from "@/hooks/useLocation";
import type {
  CustomerBestSellerItem,
  CustomerProduct,
  CustomerHomeData,
} from "@/services/customerApi.types";
import type { Product } from "@/types/product";
import type { ProductCollectionCategory } from "./bestSellerData";

import HomeHeader from "./HomeHeader";
import HomeSearch from "./HomeSearch";
import HomeCategories from "./HomeCategories";
import HomeDynamicRenderer, { DefaultHomeFallback } from "./HomeDynamicRenderer";

function toSearchProduct(product: CustomerProduct): Product {
  return {
    ...product,
    brand: product.brandName ?? product.brand?.name,
    categorySlug: product.categorySlug ?? product.category?.slug,
    image: product.thumbnail,
    images: product.gallery,
    price: product.sellingPrice,
  } as unknown as Product;
}

function toBestSellerCategories(
  items: CustomerBestSellerItem[],
): ProductCollectionCategory[] {
  return items
    .filter(
      (item) =>
        Boolean(item.id) &&
        Boolean(item.slug) &&
        Boolean(item.name) &&
        item.images.some(Boolean),
    )
    .map((item) => ({
      id: item.id,
      title: item.name,
      slug: item.slug,
      count: item.count,
      images: item.images.filter(Boolean),
    }));
}

export default function AppHome() {
  const { location, hydrated, setResolvedStoreId } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [homeData, setHomeData] =
  useState<CustomerHomeData | null | undefined>(
    undefined,
  );

  // Monotonic request counter for stale-response protection
  const latestRequestId = useRef(0);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setHomeData(undefined);

const currentRequestId = ++latestRequestId.current;
    let cancelled = false;

    getHome(undefined, location?.city)    
      .then((data) => {
        if (!cancelled && currentRequestId === latestRequestId.current) {
          setHomeData(data);
          if (data?.resolvedStoreId && setResolvedStoreId) {
            setResolvedStoreId(data.resolvedStoreId);
          }
        }
      })
      .catch((err) => {
  if (
    !cancelled &&
    currentRequestId === latestRequestId.current
  ) {
    console.error("Error fetching home data:", err);
    setHomeData(null);
  }
});

    return () => {
      cancelled = true;
    };
  }, [location?.city, hydrated, setResolvedStoreId]);



  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setFilteredProducts([]);
      return;
    }

    let cancelled = false;

    const searchTimer = window.setTimeout(() => {
      void searchProducts(query, { limit: 8 })
        .then((results) => {
          if (!cancelled) {
            setFilteredProducts(results.products.map(toSearchProduct));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFilteredProducts([]);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(searchTimer);
    };
  }, [searchQuery]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
    setSearchQuery("");
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8]">
      <main className="mx-auto max-w-md px-4 pb-32">
        <HomeHeader />

        <div className="sticky top-0 z-40 bg-[#F8FAF8]">
          <HomeSearch
            searchQuery={searchQuery}
            filteredProducts={filteredProducts}
            onSearchQueryChange={setSearchQuery}
            onProductSelect={handleProductSelect}
            onClose={() => setSearchQuery("")}
          />
          <HomeCategories />
        </div>

       {homeData === undefined ? null : homeData?.config ? (
  <HomeDynamicRenderer
    config={homeData.config}
    legacyData={homeData}
  />
) : homeData ? (
  <DefaultHomeFallback
    bestSellerCategories={toBestSellerCategories(
      homeData.bestSellers,
    )}
  />
) : null}
      </main>

      <ProductDrawer
        open={drawerOpen}
        product={selectedProduct}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
