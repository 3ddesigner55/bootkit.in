"use client";


import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCategories } from "@/services/category.service";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import HomeHeader from "@/components/home/HomeHeader";
import HomeSearch from "@/components/home/HomeSearch";
import HomeCategories from "@/components/home/HomeCategories";
import ProductDrawer from "@/components/product/ProductDrawer";
import { searchProducts } from "@/services/search.service";

import type {
  CustomerBrand,
  CustomerCategory,
  CustomerHeroBanner,
  CustomerProduct,
} from "@/services/customerApi.types";
import {
  getCustomerBrands,
  getCustomerHeroBanners,
} from "@/services/customerApi.service";
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

function getParentCategoryId(
  category: CustomerCategory,
): string | null {
  const parent = category.parentCategory;

  if (typeof parent === "string") {
    return parent;
  }

  return parent?.id ?? null;
}

function getCategoryImage(category: CustomerCategory): string {
  return category.image || category.icon || "🛍️";
}

function getCategoryOrder(category: CustomerCategory): number {
  return category.displayOrder ?? category.sortOrder ?? 0;
}

function buildHubCategorySections(
  allCategories: CustomerCategory[],
  hub: CollectionHubSlug,
  hubTitle: string,
): HubCategorySection[] {
  const categories = allCategories
    .filter(
      (category) =>
        category.active &&
        category.collectionHub === hub,
    )
    .sort(
      (first, second) =>
        getCategoryOrder(first) -
        getCategoryOrder(second),
    );

  const selectedIds = new Set(
    categories.map((category) => category.id),
  );

  const childrenByParent = new Map<
    string,
    CustomerCategory[]
  >();

  categories.forEach((category) => {
    const parentId = getParentCategoryId(category);

    if (!parentId || !selectedIds.has(parentId)) {
      return;
    }

    const children =
      childrenByParent.get(parentId) ?? [];

    children.push(category);
    childrenByParent.set(parentId, children);
  });

  const sections: HubCategorySection[] = [];
  const displayedCategoryIds = new Set<string>();

  categories.forEach((category) => {
    const children =
      childrenByParent.get(category.id) ?? [];

    if (!children.length) {
      return;
    }

    children.forEach((child) =>
      displayedCategoryIds.add(child.id),
    );

    displayedCategoryIds.add(category.id);

    sections.push({
      title: category.name,
      seeAllSlug: category.slug,
      categories: children.map((child) => ({
        name: child.name,
        slug: child.slug,
        image: getCategoryImage(child),
      })),
    });
  });

  const standaloneCategories = categories.filter(
    (category) =>
      !displayedCategoryIds.has(category.id),
  );

  if (standaloneCategories.length) {
    sections.push({
      title: `Explore ${hubTitle}`,
      seeAllSlug: hub,
      categories: standaloneCategories.map((category) => ({
        name: category.name,
        slug: category.slug,
        image: getCategoryImage(category),
      })),
    });
  }

  return sections;
}

function isCategoryImageSource(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  );
}


export default function CollectionHubPage({ hub }: CollectionHubPageProps) {
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [hubCategories, setHubCategories] = useState<
  CustomerCategory[]
>([]);
const [hubBrands, setHubBrands] = useState<CustomerBrand[]>([]);
const [hubBanners, setHubBanners] = useState<
  CustomerHeroBanner[]
>([]);

const [activeBannerIndex, setActiveBannerIndex] =
  useState(0);

const config = HUB_CONFIGS[hub] || HUB_CONFIGS.beauty;
const { theme } = config;

const brandAds = useMemo(() => {
  return hubBrands.map((brand, index) => {
    const matchingPreset = config.brandAds.find(
      (preset) => preset.id === brand.slug,
    );

    const stylePreset =
      matchingPreset ||
      config.brandAds[index % config.brandAds.length];

    return {
      id: brand.id,
      brandName: brand.name,
      offerTag:
        stylePreset?.offerTag ||
        (brand.featured ? "FEATURED" : "SHOP NOW"),
      description:
        brand.description ||
        stylePreset?.description ||
        `Explore ${brand.name} products`,
      gradient:
        stylePreset?.gradient ||
        theme.bannerGradient,
      badgeBg:
        stylePreset?.badgeBg ||
        "bg-white/20 text-white",
      badgeText:
        stylePreset?.badgeText ||
        (brand.featured ? "FEATURED" : "TOP BRAND"),
      href: `/category/${hub}?brand=${encodeURIComponent(
        brand.slug,
      )}`,
    };
  });
}, [
  config.brandAds,
  hub,
  hubBrands,
  theme.bannerGradient,
]);

const sections = useMemo(
  () =>
    buildHubCategorySections(
      hubCategories,
      hub,
      theme.title,
    ),
  [hub, hubCategories, theme.title],
);
useEffect(() => {
  let cancelled = false;

  void getCategories()
    .then((categories) => {
      if (!cancelled) {
        setHubCategories(categories);
      }
    })
    .catch(() => {
      if (!cancelled) {
        setHubCategories([]);
      }
    });

  return () => {
    cancelled = true;
  };
}, [hub]);

useEffect(() => {
  let cancelled = false;

  void getCustomerBrands(hub)
    .then((brands) => {
      if (!cancelled) {
        setHubBrands(
          brands
            .filter((brand) => brand.active)
            .sort(
              (first, second) =>
                (first.displayOrder ?? 0) -
                (second.displayOrder ?? 0),
            ),
        );
      }
    })
    .catch(() => {
      if (!cancelled) {
        setHubBrands([]);
      }
    });

  return () => {
    cancelled = true;
  };
}, [hub]);

useEffect(() => {
  let cancelled = false;

  setActiveBannerIndex(0);

  void getCustomerHeroBanners(hub)
    .then((banners) => {
      if (!cancelled) {
        setHubBanners(
          banners
            .filter((banner) => banner.active)
            .sort(
              (first, second) =>
                (first.displayOrder ?? 0) -
                (second.displayOrder ?? 0),
            ),
        );
      }
    })
    .catch(() => {
      if (!cancelled) {
        setHubBanners([]);
      }
    });

  return () => {
    cancelled = true;
  };
}, [hub]);

useEffect(() => {
  if (hubBanners.length <= 1) {
    return;
  }

  const timer = window.setInterval(() => {
    setActiveBannerIndex(
      (current) =>
        (current + 1) % hubBanners.length,
    );
  }, 4_000);

  return () => window.clearInterval(timer);
}, [hubBanners.length]);



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

  const activeBanner =
    hubBanners.length > 0
      ? hubBanners[activeBannerIndex % hubBanners.length]
      : null;

  const activeBannerImage =
    activeBanner?.mobileImage ||
    activeBanner?.desktopImage ||
    "";

  const bannerHeading =
    activeBanner?.title || theme.bannerHeading;

  const bannerSubtitle =
    activeBanner?.subtitle || theme.bannerSubtitle;

  const bannerButtonText =
    activeBanner?.buttonText || "Shop Now";

  const bannerButtonLink =
    activeBanner?.buttonLink || `/category/${hub}`;

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
    {activeBannerImage ? (
      <>
        <img
          src={activeBannerImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
      </>
    ) : null}

    <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-xl" />
    <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/15 blur-lg" />

    <div className="relative z-10 flex min-h-[180px] flex-col justify-between">
      <div>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${theme.bannerBadgeBg}`}
        >
          <Sparkles
            size={12}
            className="text-yellow-200"
          />
          {theme.bannerBadgeText}
        </div>

        <div className="mt-4">
          <h2 className="whitespace-pre-line text-2xl font-black leading-tight tracking-tight sm:text-3xl">
            {bannerHeading}
          </h2>

          <p className="mt-1.5 max-w-[90%] text-xs font-semibold text-white/90">
            {bannerSubtitle}
          </p>
        </div>
      </div>

      <div>
        <div className="mt-5 flex items-center gap-2">
          <Link
            href={bannerButtonLink}
            className={`inline-flex items-center gap-1.5 rounded-xl ${theme.bannerCtaBg} px-4 py-2 text-xs font-black ${theme.bannerCtaText} shadow-sm transition active:scale-95`}
          >
            {bannerButtonText}
            <ArrowRight size={14} />
          </Link>

          <span className="text-[10px] font-bold text-white/80">
            *Limited time offers
          </span>
        </div>

        {hubBanners.length > 1 ? (
          <div className="mt-4 flex gap-1.5">
            {hubBanners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() =>
                  setActiveBannerIndex(index)
                }
                aria-label={`Show banner ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeBannerIndex
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  </div>
</section>

          {/* First Category Section */}
          {sections[0] ? (
  <HubCategorySectionRow
    section={sections[0]}
    theme={theme}
  />
) : null}

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
    key={`${section.title}-${section.seeAllSlug}`}
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
            <div className="relative flex h-20 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#F9FAF9] to-[#F0F3F0] text-3xl shadow-inner transition group-hover:scale-105">
  {isCategoryImageSource(item.image) ? (
    <>
      <span aria-hidden="true">🛍️</span>

      <img
        src={item.image}
        alt=""
        className="absolute inset-0 h-full w-full object-contain p-1"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </>
  ) : (
    <span aria-hidden="true">
      {item.image || "🛍️"}
    </span>
  )}
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
