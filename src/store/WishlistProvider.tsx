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
import type { WishlistContextValue } from "@/types/wishlist";

export const WishlistContext =
  createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = "bootkit_wishlist_v1";

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

function readStoredWishlist(): Product[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidProduct);
  } catch {
    return [];
  }
}

export default function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredWishlist());
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

  const isWishlisted = useCallback(
    (productId: string) =>
      items.some((product) => product.id === productId),
    [items]
  );

  const addToWishlist = useCallback((product: Product) => {
    setItems((current) => {
      const exists = current.some(
        (item) => item.id === product.id
      );

      if (exists) return current;

      return [product, ...current];
    });
  }, []);

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setItems((current) =>
        current.filter((product) => product.id !== productId)
      );
    },
    []
  );

  const toggleWishlist = useCallback((product: Product) => {
    setItems((current) => {
      const exists = current.some(
        (item) => item.id === product.id
      );

      if (exists) {
        return current.filter(
          (item) => item.id !== product.id
        );
      }

      return [product, ...current];
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      totalItems: items.length,
      hydrated,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [
      items,
      hydrated,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}