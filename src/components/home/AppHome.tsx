"use client";

import { useMemo, useState } from "react";

import ProductDrawer from "@/components/product/ProductDrawer";
import { products } from "@/data/products";
import type { Product } from "@/types/product";

import HomeHeader from "./HomeHeader";
import HomeSearch from "./HomeSearch";
import HomeCategories from "./HomeCategories";
import GroceryKitchen from "./sections/GroceryKitchen";
import HeroCarousel from "./hero/HeroCarousel";
import OfferSection from "./offers/OfferSection";
import SnacksDrinks from "./sections/SnacksDrinks";
import SweetTooth from "./sections/SweetTooth";
import FeaturedThisWeek from "./sections/FeaturedThisWeek";
import BottomNavigation from "./navigation/BottomNavigation";
import BeautyPersonalCare from "./sections/BeautyPersonalCare";
import BestSellerGrid from "./BestSellerGrid";
import HouseholdEssentials from "./sections/HouseholdEssentials";
import StoreSpotlight from "./sections/StoreSpotlight";

export default function AppHome() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return products
      .filter(
        (product) =>
          product.active &&
          [product.name, product.brand, product.categorySlug].some((value) =>
            value.toLocaleLowerCase().includes(normalizedQuery)
          )
      )
      .slice(0, 8);
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
        <BestSellerGrid />
        <GroceryKitchen />
        <HouseholdEssentials />
        <SweetTooth />
        <FeaturedThisWeek />
        <SnacksDrinks />
        <BeautyPersonalCare />
        <StoreSpotlight />
      </main>

      <BottomNavigation />

      <ProductDrawer
        open={drawerOpen}
        product={selectedProduct}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
