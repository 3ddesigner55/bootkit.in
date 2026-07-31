"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/types/product";
import type { RecentlyViewedContextValue } from "@/types/recentlyViewed";

export const RecentlyViewedContext =
  createContext<RecentlyViewedContextValue | null>(null);

const STORAGE_KEY = "bootkit_recently_viewed_v1";
const MAX_ITEMS = 12;

function isValidProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;

  const product = value as Partial<Product>;

  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.slug === "string" &&
    typeof product.price === "number"
  );
}

function readStoredItems(): Product[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidProduct).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export default function RecentlyViewedProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch {
      // Storage failure should not break the app.
    }
  }, [items, hydrated]);

  const addRecentlyViewed = useCallback((product: Product) => {
    setItems((current) => {
      const withoutCurrent = current.filter(
        (item) => item.id !== product.id
      );

      return [product, ...withoutCurrent].slice(0, MAX_ITEMS);
    });
  }, []);

  const removeRecentlyViewed = useCallback((productId: string) => {
    setItems((current) =>
      current.filter((product) => product.id !== productId)
    );
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<RecentlyViewedContextValue>(
    () => ({
      items,
      hydrated,
      addRecentlyViewed,
      removeRecentlyViewed,
      clearRecentlyViewed,
    }),
    [
      items,
      hydrated,
      addRecentlyViewed,
      removeRecentlyViewed,
      clearRecentlyViewed,
    ]
  );

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}