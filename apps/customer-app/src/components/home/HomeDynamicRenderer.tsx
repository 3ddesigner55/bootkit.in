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
    .map((item) => ({
      id: item.referenceId || "",
      name: item.name || item.title || "",
      slug: item.slug || "",
      price: typeof item.sellingPrice === "number" ? item.sellingPrice : 0,
      mrp: typeof item.mrp === "number" ? item.mrp : typeof item.sellingPrice === "number" ? item.sellingPrice : 0,
      stock: typeof item.stock === "number" ? item.stock : 0,
      image: item.thumbnail || item.image || "/images/placeholder.png",
      images: item.thumbnail ? [item.thumbnail] : [],
      unit: "1 pc",
      active: true,
    } as unknown as Product));
}

function adaptBestSellerCategories(items: ResolvedHomeConfigItem[]): ProductCollectionCategory[] {
  return items
    .filter((item) => item && (item.itemType === "category" || item.itemType === "collection"))
    .map((item) => ({
      title: item.name || item.title || "Best Seller",
      slug: item.slug || "",
      count: item.count || "10+ items",
      images: item.images && item.images.length > 0 ? item.images : [item.image || item.thumbnail || "/images/placeholder.png"],
      matches: (product: any) =>
        (product.categorySlug || product.category?.slug) === item.slug,
    }));
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
    <>
      <HeroCarousel />
      <OfferSection />
      <BestSellerGrid />
      <GroceryKitchen />
      <DryFoodMasala />
      <HouseholdEssentials />
      <SweetTooth />
      <FeaturedThisWeek />
      <SnacksDrinks />
      <BeautyPersonalCare />
      <StoreSpotlight />
    </>
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
      return <HeroCarousel banners={banners} />;
    }

    case "offer_section":
    case "offer": {
      const offers = adaptOffers(activeItems);
      return <OfferSection offers={offers} />;
    }

    case "best_seller_grid":
    case "best_sellers": {
      const categories = adaptBestSellerCategories(activeItems);
      return <BestSellerGrid categories={categories} />;
    }

    case "grocery_kitchen":
    case "household_essentials":
    case "snacks_drinks":
    case "beauty_personal_care":
    case "category_cards":
    case "category_grid": {
      const catItems = adaptCategorySectionItems(activeItems);
      const items = catItems.length > 0 ? catItems : undefined;
      const viewAllUrl = (section as any).viewAllUrl || (section.sourceCategory?.slug
        ? `/category/${section.sourceCategory.slug}`
        : undefined);
      // Compatibility check: section.sectionId === "grocery_kitchen" || section.sectionId === "household_essentials"
      const rowCount = (section as any).rowCount || (["grocery_kitchen"].includes(section.type) || section.sectionId === "grocery_kitchen" ? 1 : 2);
      if (rowCount === 1) {
        return <GroceryKitchen items={items} title={section.title} viewAllUrl={viewAllUrl} />;
      } else {
        return <HouseholdEssentials items={items} title={section.title} viewAllUrl={viewAllUrl} />;
      }
    }

    case "sweet_tooth":
    case "dry_food_masala":
    case "product_grid": {
      const products = adaptProducts(activeItems);
      const viewAllUrl = (section as any).viewAllUrl || (section.sourceCategory?.slug
        ? `/category/${section.sourceCategory.slug}`
        : undefined);
      return <DryFoodMasala products={products} title={section.title} viewAllUrl={viewAllUrl} />;
    }

    case "featured_this_week":
    case "featured_banner": {
      const banners = activeItems
        .filter((item) => item.itemType === "banner" || item.itemType === "offer")
        .map((item) => {
          const safeLink = resolveSafeInternalUrl(
            item.targetType || "collection",
            item.targetValue || item.linkUrl || "",
          );
          return {
            id: item.referenceId,
            title: item.title || section.title,
            desktopImage: item.imageUrl || item.image || "/images/banners/placeholder.png",
            mobileImage: item.imageUrl || item.image || "/images/banners/placeholder.png",
            buttonLink: safeLink || "/categories",
            displayOrder: item.sortOrder || 1,
            showOnHome: true,
            active: true,
          };
        });
      return <FeaturedThisWeek banners={banners} title={section.title} />;
    }

    case "store_spotlight": {
      const stores = adaptSpotlightStores(activeItems);
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
  // If no published config or empty sections or unsupported schema version, render exact default fallback
  if (
    !config ||
    config.schemaVersion !== SUPPORTED_SCHEMA_VERSION ||
    !config.sections ||
    config.sections.length === 0
  ) {
    return <DefaultHomeFallback />;
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

