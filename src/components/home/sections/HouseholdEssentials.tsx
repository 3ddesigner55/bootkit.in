"use client";

import SectionBlock from "./SectionBlock";
import {
  getHomeCategorySection,
  type HomeCategoryItem,
} from "@/services/home.service";
import { useEffect, useState } from "react";

interface HouseholdEssentialsProps {
  items?: HomeCategoryItem[];
  title?: string;
  viewAllUrl?: string;
}

export default function HouseholdEssentials({
  items: initialItems,
  title = "Household Essentials",
  viewAllUrl,
}: HouseholdEssentialsProps = {}) {
  const isDynamicMode = initialItems !== undefined;
  const [householdItems, setHouseholdItems] = useState<HomeCategoryItem[]>(initialItems || []);
  const [hydrated, setHydrated] = useState(isDynamicMode);

  useEffect(() => {
    if (isDynamicMode) {
      setHouseholdItems(initialItems || []);
      setHydrated(true);
      return;
    }

    let cancelled = false;

    void getHomeCategorySection("householdEssentials")
      .then((items) => {
        if (!cancelled) {
          setHouseholdItems(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHouseholdItems([]);
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

  if (!hydrated || householdItems.length === 0) {
    return null;
  }

  return (
    <SectionBlock
      title={title}
      items={householdItems}
      viewAllUrl={viewAllUrl}
    />
  );
}

