"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ProductDrawer from "@/components/product/ProductDrawer";
import { searchProducts } from "@/services/search.service";
import {
  getHome,
  getCachedCustomerHomeData,
  subscribeHomeDataUpdates,
  invalidateHomeDataCache,
} from "@/services/home.service";
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
import OfferSection from "./offers/OfferSection";
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
  const { location, setResolvedStoreId } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [homeData, setHomeData] = useState<CustomerHomeData | null>(() => {
    return getCachedCustomerHomeData(undefined, location?.city);
  });

  // Monotonic request counter for stale-response protection
  const latestRequestId = useRef(0);

  const fetchFreshHomeData = useCallback((forceRefresh = false) => {
    const currentRequestId = ++latestRequestId.current;
    getHome(undefined, location?.city)
      .then((data) => {
        if (currentRequestId === latestRequestId.current) {
          setHomeData(data);
          if (data?.resolvedStoreId && setResolvedStoreId) {
            setResolvedStoreId(data.resolvedStoreId);
          }
        }
      })
      .catch((err) => {
        if (currentRequestId === latestRequestId.current) {
          console.error("Error fetching home data:", err);
        }
      });
  }, [location?.city, setResolvedStoreId]);

  useEffect(() => {
    // Initial fetch
    fetchFreshHomeData();

    // Subscribe to background SWR updates from customerApi.service
    const unsubscribe = subscribeHomeDataUpdates((freshData) => {
      setHomeData(freshData);
      if (freshData?.resolvedStoreId && setResolvedStoreId) {
        setResolvedStoreId(freshData.resolvedStoreId);
      }
    });

    // Listen to cross-tab / Admin Merchandising Broadcast Channel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("bootkit_merchandising");
      channel.onmessage = (event) => {
        if (event.data?.type === "HOME_CONFIG_UPDATED") {
          invalidateHomeDataCache();
          fetchFreshHomeData(true);
        }
      };
    } catch {}

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "bootkit_merchandising_sync") {
        invalidateHomeDataCache();
        fetchFreshHomeData(true);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchFreshHomeData();
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unsubscribe();
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchFreshHomeData, setResolvedStoreId]);



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

        <OfferSection />

        {homeData?.config && (
          <HomeDynamicRenderer
            config={homeData.config}
            legacyData={homeData}
          />
        )}
      </main>

      <ProductDrawer
        open={drawerOpen}
        product={selectedProduct}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
