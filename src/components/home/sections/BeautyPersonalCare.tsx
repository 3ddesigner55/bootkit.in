"use client";

import SectionBlock from "./SectionBlock";
import {
  getHomeCategorySection,
  type HomeCategoryItem,
} from "@/services/home.service";
import { useEffect, useState } from "react";

interface BeautyPersonalCareProps {
  items?: HomeCategoryItem[];
  title?: string;
  viewAllUrl?: string;
}

export default function BeautyPersonalCare({
  items: initialItems,
  title = "Beauty & Personal Care",
  viewAllUrl,
}: BeautyPersonalCareProps = {}) {
  const isDynamicMode = initialItems !== undefined;
  const [beautyItems, setBeautyItems] = useState<HomeCategoryItem[]>(initialItems || []);
  const [hydrated, setHydrated] = useState(isDynamicMode);

  useEffect(() => {
    if (isDynamicMode) {
      setBeautyItems(initialItems || []);
      setHydrated(true);
      return;
    }

    let cancelled = false;

    void getHomeCategorySection("beautyPersonalCare")
      .then((items) => {
        if (!cancelled) {
          setBeautyItems(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBeautyItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialItems, isDynamicMode]);

  if (!hydrated || beautyItems.length === 0) {
    return null;
  }

  return (
    <SectionBlock
      title={title}
      items={beautyItems}
      viewAllUrl={viewAllUrl}
    />
  );
}

