"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product, ProductVariant } from "@/types/product";
import type { CartItem } from "@/types/cart";

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  hydrated: boolean;
  getQuantity: (productId: string, variantId?: string) => number;
  addItem: (product: Product, variant?: ProductVariant) => void;
  addItems: (items: CartItem[]) => void;
  increaseItem: (productId: string, variantId?: string) => void;
  decreaseItem: (productId: string, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "bootkit_cart_v1";

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<CartItem>;

  return (
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    !!item.product &&
    typeof item.product === "object" &&
    typeof item.product.id === "string" &&
    (item.variantId === undefined || typeof item.variantId === "string")
  );
}

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidCartItem);
  } catch {
    return [];
  }
}

type CartProviderProps = {
  children: ReactNode;
};

export default function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage failure should not break shopping.
    }
  }, [items, hydrated]);

  const getQuantity = useCallback(
    (productId: string, variantId?: string) =>
      items.find((item) => item.product.id === productId && item.variantId === variantId)?.quantity ?? 0,
    [items]
  );

  const addItems = useCallback((newItems: CartItem[]) => {
    setItems((current) => {
      const updated = [...current];

      for (const newItem of newItems) {
        const existingIndex = updated.findIndex(
          (item) => item.product.id === newItem.product.id && item.variantId === newItem.variantId
        );

        if (existingIndex >= 0) {
          const existing = updated[existingIndex];

          updated[existingIndex] = {
            ...existing,
            quantity: Math.min(
              existing.quantity + newItem.quantity,
              existing.product.stock
            ),
            variantId: newItem.variantId,
            variantName: newItem.variantName,
          };
        } else {
          updated.push({
            product: newItem.product,
            quantity: Math.min(
              Math.max(newItem.quantity, 1),
              newItem.product.stock
            ),
          });
        }
      }

      return updated;
    });
  }, []);

  const addItem = useCallback((product: Product, variant?: ProductVariant) => {
    const selectedProduct = variant ? {
      ...product,
      image: variant.image ?? variant.images?.[0] ?? product.image,
      unit: variant.unit,
      mrp: variant.mrp,
      price: variant.price,
      stock: variant.stock,
    } : product;

    if (selectedProduct.stock <= 0) return;

    setItems((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id && item.variantId === variant?.id
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id && item.variantId === variant?.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  item.product.stock
                ),
              }
            : item
        );
      }

      return [{ product: selectedProduct, quantity: 1, variantId: variant?.id, variantName: variant?.name }, ...current];
    });
  }, []);

  const increaseItem = useCallback((productId: string, variantId?: string) => {
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId && item.variantId === variantId
          ? {
              ...item,
              quantity: Math.min(
                item.quantity + 1,
                item.product.stock
              ),
            }
          : item
      )
    );
  }, []);

  const decreaseItem = useCallback((productId: string, variantId?: string) => {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.product.id !== productId || item.variantId !== variantId) return [item];

        if (item.quantity <= 1) return [];

        return [
          {
            ...item,
            quantity: item.quantity - 1,
          },
        ];
      })
    );
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId || item.variantId !== variantId)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      ),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      
      items,
      totalItems,
      subtotal,
      hydrated,
      getQuantity,
      addItems,
      addItem,
      increaseItem,
      decreaseItem,
      removeItem,
      clearCart,
    }),
    [
      items,
      totalItems,
      subtotal,
      hydrated,
      getQuantity,
      addItems,
      addItem,
      increaseItem,
      decreaseItem,
      removeItem,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
