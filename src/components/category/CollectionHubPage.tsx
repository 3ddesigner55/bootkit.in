"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import HomeHeader from "@/components/home/HomeHeader";
import HomeSearch from "@/components/home/HomeSearch";
import HomeCategories from "@/components/home/HomeCategories";
import ProductDrawer from "@/components/product/ProductDrawer";
import { searchProducts } from "@/services/search.service";
import type { CustomerProduct } from "@/services/customerApi.types";
import type { Product } from "@/types/product";
import {
  HUB_CONFIGS,
  type CollectionHubSlug,
  type HubCategorySection,
  type HubTheme,
} from "@/config/hubConfig";

interface CollectionHubPageProps {
  hub: CollectionHubSlug;
}

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

export default function CollectionHubPage({ hub }: CollectionHubPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const config = HUB_CONFIGS[hub] || HUB_CONFIGS.beauty;
  const { theme, sections, brandAds } = config;

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
        {/* 1. Exact Same Home Header */}
        <HomeHeader />

        {/* 2. Exact Same Sticky Home Search & Home Categories Strip */}
        <div className="sticky top-0 z-40 bg-[#F8FAF8]">
          <HomeSearch
            searchQuery={searchQuery}
            filteredProducts={filteredProducts}
            onSearchQueryChange={setSearchQuery}
            onProductSelect={handleProductSelect}
            onClose={() => setSearchQuery("")}
          />
          <HomeCategories selected={hub} />
        </div>

        {/* 3. Hub-Specific Content */}
        <div className="space-y-6 pt-4">
          {/* Hero Promotional Banner */}
          <section>
            <div
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.bannerGradient} p-6 text-white ${theme.bannerShadow}`}
            >
              {/* Background Decorative Rings */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-xl" />
              <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-black/15 blur-lg" />

              <div className="relative z-10 flex flex-col justify-between">
                <div
                  className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${theme.bannerBadgeBg}`}
                >
                  <Sparkles size={12} className="text-yellow-200" />
                  {theme.bannerBadgeText}
                </div>

                <div className="mt-4">
                  <h2 className="whitespace-pre-line text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                    {theme.bannerHeading}
                  </h2>
                  <p className="mt-1.5 text-xs font-semibold text-white/90">
                    {theme.bannerSubtitle}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <Link
                    href={`/category/${hub}`}
                    className={`inline-flex items-center gap-1.5 rounded-xl ${theme.bannerCtaBg} px-4 py-2 text-xs font-black ${theme.bannerCtaText} shadow-sm transition active:scale-95`}
                  >
                    Shop Now <ArrowRight size={14} />
                  </Link>
                  <span className="text-[10px] font-bold text-white/80">
                    *Limited time offers
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* First Category Section */}
          {sections[0] && (
            <HubCategorySectionRow section={sections[0]} theme={theme} />
          )}

          {/* Horizontal Brand Ads Section */}
          {brandAds.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Top {theme.title} Brands
                  </h3>
                  <p className="text-[11px] font-semibold text-gray-500">
                    Exclusive brand offers & deals
                  </p>
                </div>
              </div>

              <div className="-mx-4 flex gap-3.5 overflow-x-auto scrollbar-hide px-4 py-1">
                {brandAds.map((brand) => (
                  <Link
                    key={brand.id}
                    href={brand.href}
                    className={`relative flex h-[130px] w-[240px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${brand.gradient} p-4 text-white shadow-sm transition active:scale-[0.98]`}
                  >
                    {/* Background Glow */}
                    <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-white/10 blur-lg" />

                    <div className="flex items-start justify-between">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-md ${brand.badgeBg}`}
                      >
                        {brand.badgeText}
                      </span>
                      <span className="text-xs font-black tracking-wide text-yellow-300">
                        {brand.offerTag}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black tracking-tight">
                        {brand.brandName}
                      </h4>
                      <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-white/85">
                        {brand.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Remaining Category Sections */}
          {sections.slice(1).map((section) => (
            <HubCategorySectionRow
              key={section.title}
              section={section}
              theme={theme}
            />
          ))}
        </div>
      </main>

      <ProductDrawer
        open={drawerOpen}
        product={selectedProduct}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}

function HubCategorySectionRow({
  section,
  theme,
}: {
  section: HubCategorySection;
  theme: HubTheme;
}) {
  return (
    <section className="space-y-3">
      {/* Section Heading */}
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-base font-black text-gray-900">
            {section.title}
          </h3>
          {section.subtitle && (
            <p className="text-[11px] font-semibold text-gray-500">
              {section.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Exactly 3 Category Cards in 1 Row on Mobile */}
      <div className="grid grid-cols-3 gap-3">
        {section.categories.map((item) => (
          <Link
            key={item.slug}
            href={`/category/${item.slug}`}
            className="group flex flex-col items-center justify-between rounded-2xl border border-[#ECEFEC] bg-white p-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition active:scale-95 hover:border-[var(--primary)]"
          >
            {/* Category Image / Icon Container */}
            <div className="flex h-20 w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#F9FAF9] to-[#F0F3F0] text-3xl shadow-inner transition group-hover:scale-105">
              {item.image}
            </div>

            {/* Category Title */}
            <span className="mt-2 line-clamp-2 text-[11px] font-bold leading-tight text-gray-800">
              {item.name}
            </span>
          </Link>
        ))}
      </div>

      {/* See All Products Button with Dynamic Hub Theme Colors */}
      <Link
        href={`/category/${section.seeAllSlug}`}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl border ${theme.btnBorder} ${theme.btnBg} py-2.5 text-xs font-extrabold ${theme.btnText} ${theme.btnHoverBg} shadow-sm transition active:scale-[0.99]`}
      >
        <span>See All Products</span>
        <ChevronRight size={15} />
      </Link>
    </section>
  );
}
