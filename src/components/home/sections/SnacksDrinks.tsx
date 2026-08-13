"use client";

import SectionBlock from "./SectionBlock";
import {
  getHomeCategorySection,
  type HomeCategoryItem,
} from "@/services/home.service";
import { useEffect, useState } from "react";

interface SnacksDrinksProps {
  items?: HomeCategoryItem[];
  title?: string;
  viewAllUrl?: string;
}

export default function SnacksDrinks({
  items: initialItems,
  title = "Snacks & Drinks",
  viewAllUrl,
}: SnacksDrinksProps = {}) {
  const isDynamicMode = initialItems !== undefined;
  const [snackItems, setSnackItems] = useState<HomeCategoryItem[]>(initialItems || []);
  const [hydrated, setHydrated] = useState(isDynamicMode);

  useEffect(() => {
    if (isDynamicMode) {
      setSnackItems(initialItems || []);
      setHydrated(true);
      return;
    }

    let cancelled = false;

    void getHomeCategorySection("snacksDrinks")
      .then((items) => {
        if (!cancelled) {
          setSnackItems(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnackItems([]);
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

  if (!hydrated || snackItems.length === 0) {
    return null;
  }

  return (
    <SectionBlock
      title={title}
      items={snackItems}
      viewAllUrl={viewAllUrl}
    />
  );
}

