"use client";

import React from "react";
import SectionErrorBoundary from "./SectionErrorBoundary";
import type { Product } from "@/types/product";
import type { ProductCollectionCategory } from "./bestSellerData";
import { resolveSafeInternalUrl } from "@/utils/navigationWhitelist";

// Direct reuse of existing locked visual components
import HeroCarousel, { type CarouselBanner } from "./hero/HeroCarousel";
import OfferSection, { type OfferItem } from "./offers/OfferSection";
import BestSellerGrid from "./BestSellerGrid";
import GroceryKitchen from "./sections/GroceryKitchen";
import DryFoodMasala from "./sections/DryFoodMasala";
import HouseholdEssentials from "./sections/HouseholdEssentials";
import SweetTooth from "./sections/SweetTooth";
import FeaturedThisWeek from "./sections/FeaturedThisWeek";
import SnacksDrinks from "./sections/SnacksDrinks";
import BeautyPersonalCare from "./sections/BeautyPersonalCare";
import StoreSpotlight, { type SpotlightStore } from "./sections/StoreSpotlight";
import SectionBlock from "./sections/SectionBlock";

export const SUPPORTED_SCHEMA_VERSION = "1.0.0";

export type SectionType =
  | "hero_carousel"
  | "hero_banner"
  | "offer_section"
  | "offer"
  | "best_seller_grid"
  | "best_sellers"
  | "grocery_kitchen"
  | "dry_food_masala"
  | "household_essentials"
  | "sweet_tooth"
  | "featured_this_week"
  | "featured_banner"
  | "snacks_drinks"
  | "beauty_personal_care"
  | "store_spotlight"
  | "category_cards"
  | "product_grid"
  | "category_grid";


export interface ResolvedHomeConfigItem {
  itemType: "product" | "category" | "banner" | "offer" | "collection" | "store";
  referenceId: string;
  name?: string;
  slug?: string;
  image?: string;
  thumbnail?: string;
  sellingPrice?: number;
  mrp?: number;
  stock?: number;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  city?: string;
  targetType?: string;
  targetValue?: string;
  sortOrder?: number;
  count?: string;
  images?: string[];
  displayProductIds?: string[];
}

export interface ResolvedHomeConfigSection {
  sectionId: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  itemMode?: "MANUAL" | "BEST_SELLING" | "CATEGORY" | "RECENT";
  sortOrder: number;
  items: ResolvedHomeConfigItem[];
  sourceCategory?: {
    name: string;
    slug: string;
    image?: string;
    level?: number;
  };
  sourceCategoryId?: string;
}

export interface HomeConfigPayload {
  schemaVersion: string;
  configVersion: number;
  scopeType?: string;
  scopeId?: string | null;
  publishedAt?: string;
  sections: ResolvedHomeConfigSection[];
}

interface HomeDynamicRendererProps {
  config: HomeConfigPayload | null;
  legacyData?: any;
}

// -------------------------------------------------------------
// DTO Adapters with strict runtime schema validation
// -------------------------------------------------------------

function adaptHeroBanners(items: ResolvedHomeConfigItem[]): CarouselBanner[] {
  return items
    .filter((item) => item && item.itemType === "banner")
    .map((item) => {
      const safeLink = resolveSafeInternalUrl(item.targetType || "collection", item.targetValue || item.linkUrl || "");
      return {
        title: item.title || item.name || "BootKiT Deals",
        subtitle: item.subtitle || "",
        image: item.imageUrl || item.image || "/images/banners/placeholder.png",
        linkUrl: safeLink || "/categories",
      };
    });
}

function adaptOffers(items: ResolvedHomeConfigItem[]): OfferItem[] {
  return items
    .filter((item) => item && item.itemType === "offer")
    .map((item) => ({
      title: item.title || item.name || "Special Offer",
      subtitle: item.subtitle || "",
      color: "bg-emerald-50 text-emerald-900 border-emerald-200",
    }));
}

function adaptCategorySectionItems(items: ResolvedHomeConfigItem[]) {
  return items
    .filter((item) => item && item.itemType === "category")
    .map((item) => ({
      name: item.name || item.title || "Category",
      slug: item.slug || "",
      image: item.image || item.thumbnail || "/images/placeholder.png",
    }));
}


function adaptProducts(items: ResolvedHomeConfigItem[]): Product[] {
  return items
    .filter((item) => item && item.itemType === "product")
    .map((item) => {
      const primary = item.thumbnail || item.image || "/images/placeholder.png";
      const imagesList = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.thumbnail
          ? [item.thumbnail]
          : item.image
            ? [item.image]
            : [];
      return {
        id: item.referenceId || "",
        name: item.name || item.title || "",
        slug: item.slug || "",
        price: typeof item.sellingPrice === "number" ? item.sellingPrice : 0,
        mrp: typeof item.mrp === "number" ? item.mrp : typeof item.sellingPrice === "number" ? item.sellingPrice : 0,
        stock: typeof item.stock === "number" ? item.stock : 10,
        image: primary,
        thumbnail: primary,
        images: imagesList,
        unit: typeof (item as any).unit === "object" && (item as any).unit?.label
          ? (item as any).unit
          : { label: typeof (item as any).unit === "string" ? (item as any).unit : "1 pc", value: "1 pc" },
        rating: (item as any).rating || 4.8,
        deliveryMinutes: (item as any).deliveryMinutes || 10,
        fallbackIcon: "🛒",
        active: true,
      } as unknown as Product;
    });
}

const DEFAULT_PREVIEW_IMAGES = [
  "/images/products/milk.png",
  "/images/products/apple.jpg",
  "/images/products/banana.png",
  "/images/products/potato.png",
];

function normalizeFourImages(images?: string[], fallbackImage?: string): string[] {
  const valid = (images || []).filter((img) => typeof img === "string" && img.trim() !== "");
  if (fallbackImage && typeof fallbackImage === "string" && fallbackImage.trim() !== "" && !valid.includes(fallbackImage)) {
    valid.push(fallbackImage);
  }
  if (valid.length === 0) {
    return DEFAULT_PREVIEW_IMAGES;
  }
  const result = [...valid];
  let idx = 0;
  while (result.length < 4) {
    result.push(valid[idx % valid.length] || DEFAULT_PREVIEW_IMAGES[idx % DEFAULT_PREVIEW_IMAGES.length]);
    idx++;
  }
  return result.slice(0, 4);
}

function adaptBestSellerCategories(items: ResolvedHomeConfigItem[]): ProductCollectionCategory[] {
  return items
    .filter((item) => item && (item.itemType === "category" || item.itemType === "collection"))
    .map((item) => {
      const singleFallback = item.image || item.thumbnail;
      const fourImages = normalizeFourImages(item.images, singleFallback);
      return {
        id: item.referenceId || item.slug || "",
        title: item.name || item.title || "Best Seller",
        slug: item.slug || "",
        count: item.count || "10+ items",
        images: fourImages,
        matches: (product: any) =>
          (product.categorySlug || product.category?.slug) === item.slug,
      };
    });
}

function adaptSpotlightStores(items: ResolvedHomeConfigItem[]): SpotlightStore[] {
  return items
    .filter((item) => item && item.itemType === "store")
    .map((item) => {
      const safeLink = resolveSafeInternalUrl(
        item.targetType || "internal_page",
        item.targetValue || `/category/${item.slug || ""}`,
      );
      return {
        name: item.name || "Local Store",
        description: item.city ? `Serving ${item.city}` : "Fast local fulfillment",
        image: item.image || "/images/stores/fresh-mart.png",
        delivery: "10-20 min",
        href: safeLink || `/category/${item.slug || ""}`,
      };
    });
}

// -------------------------------------------------------------
// EXACT DEFAULT HOME FALLBACK SEQUENCE
// -------------------------------------------------------------
export function DefaultHomeFallback() {
  return (
    <div className="mt-5 space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center rounded-xl bg-gray-50 p-2">
              <div className="h-16 w-16 animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-2 h-3 w-12 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 h-5 w-36 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col rounded-xl border border-gray-100 p-2.5">
              <div className="h-28 w-full animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-6 w-full animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COMPILED SECTION RENDERER DISPATCHER
// -------------------------------------------------------------
function renderSection(section: ResolvedHomeConfigSection) {
  const activeItems = (section.items || []).filter((i) => i !== undefined);

  switch (section.type) {
    case "hero_carousel":
    case "hero_banner": {
      const banners = adaptHeroBanners(activeItems);
      if (banners.length === 0) return null;
      return <HeroCarousel banners={banners} />;
    }

    case "offer_section":
    case "offer": {
      const offers = adaptOffers(activeItems);
      if (offers.length === 0) return null;
      return <OfferSection offers={offers} />;
    }

    case "best_seller_grid":
    case "best_sellers": {
      const categories = adaptBestSellerCategories(activeItems);
      if (categories.length === 0) return null;
      return <BestSellerGrid categories={categories} />;
    }

    case "grocery_kitchen":
    case "household_essentials":
    case "snacks_drinks":
    case "beauty_personal_care":
    case "category_cards":
    case "category_grid": {
      const catItems = adaptCategorySectionItems(activeItems);
      if (catItems.length === 0) return null;
      const viewAllUrl = (section as any).viewAllUrl || (section.sourceCategory?.slug
        ? `/category/${section.sourceCategory.slug}`
        : undefined);
      // Compatibility check: section.sectionId === "grocery_kitchen" || section.sectionId === "household_essentials"
      const rowCount = (section as any).rowCount || (["grocery_kitchen"].includes(section.type) || section.sectionId === "grocery_kitchen" ? 1 : 2);
      if (rowCount === 1) {
        return <GroceryKitchen items={catItems} title={section.title} viewAllUrl={viewAllUrl} />;
      } else {
        return <HouseholdEssentials items={catItems} title={section.title} viewAllUrl={viewAllUrl} />;
      }
    }

    case "sweet_tooth":
    case "dry_food_masala":
    case "product_grid": {
      const products = adaptProducts(activeItems);
      if (products.length === 0) return null;
      const viewAllUrl = (section as any).viewAllUrl || (section.sourceCategory?.slug
        ? `/category/${section.sourceCategory.slug}`
        : undefined);
      return <DryFoodMasala products={products} title={section.title} viewAllUrl={viewAllUrl} />;
    }

    case "featured_this_week":
    case "featured_banner": {
      const banners = activeItems
        .filter((item) => item.itemType === "banner" || item.itemType === "offer")
        .map((item, idx) => {
          const safeLink = resolveSafeInternalUrl(
            item.targetType || "collection",
            item.targetValue || item.linkUrl || "",
          );
          const fallbackBanner = `/images/banners/banner${(idx % 3) + 1}.png`;
          const rawImage = item.imageUrl || item.image || "";
          const validImage = rawImage && !rawImage.includes("undefined") && !rawImage.includes("null") ? rawImage : fallbackBanner;
          return {
            id: item.referenceId || `featured-banner-${idx}`,
            title: item.title || section.title,
            desktopImage: validImage,
            mobileImage: validImage,
            buttonLink: safeLink || "/categories",
            displayOrder: item.sortOrder || idx + 1,
            showOnHome: true,
            active: true,
          };
        });
      if (banners.length === 0) return null;
      return <FeaturedThisWeek banners={banners} title={section.title} />;
    }

    case "store_spotlight": {
      const stores = adaptSpotlightStores(activeItems);
      if (stores.length === 0) return null;
      return <StoreSpotlight stores={stores} title={section.title} />;
    }

    default:
      // Unknown section types return null defensively
      return null;
  }
}


function safeRenderSection(section: ResolvedHomeConfigSection) {
  try {
    return renderSection(section);
  } catch (err: any) {
    console.error(`[HomeDynamicRenderer] Dispatch error in section "${section.sectionId}":`, err?.message);
    return null;
  }
}

export default function HomeDynamicRenderer({
  config,
}: HomeDynamicRendererProps) {
  // If no published config or empty sections or unsupported schema version, render null
  if (
    !config ||
    config.schemaVersion !== SUPPORTED_SCHEMA_VERSION ||
    !config.sections ||
    config.sections.length === 0
  ) {
    return null;
  }

  // Sort sections deterministically by sortOrder
  const sortedSections = [...config.sections].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <>
      {sortedSections.map((section) => (
        <SectionErrorBoundary
          key={section.sectionId}
          sectionId={section.sectionId}
        >
          {safeRenderSection(section)}
        </SectionErrorBoundary>
      ))}
    </>
  );
}

