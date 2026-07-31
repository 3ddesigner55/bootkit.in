"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products as defaultProducts } from "@/data/products";
import type { Product } from "@/types/product";
import type {
  ProductAdminContextValue,
  ProductInput,
} from "@/types/productAdmin";

export const ProductAdminContext =
  createContext<ProductAdminContextValue | null>(null);

const STORAGE_KEY = "bootkit_admin_products_v1";

function cloneDefaultProducts(): Product[] {
  return defaultProducts.map((product) => ({
    ...product,

    images: product.images ?? [],

    unit: {
      ...product.unit,
    },
    tags: product.tags ?? [],
    variants: product.variants?.map((variant) => ({
      ...variant,
      sku: variant.sku || `${product.slug}-${variant.id}`,
      images: variant.images ?? (variant.image ? [variant.image] : []),
      attributes: variant.attributes ?? {},
    })),
  }));
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") {
    return false;
  }

  const product = value as Partial<Product>;

  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.slug === "string" &&
    typeof product.brand === "string" &&
    typeof product.categorySlug === "string" &&
    typeof product.image === "string" &&
    
(
  product.images === undefined ||
  (
    Array.isArray(product.images) &&
    product.images.every(
      (img) => typeof img === "string"
    )
  )
) &&
    typeof product.fallbackIcon === "string" &&
    typeof product.mrp === "number" &&
    typeof product.price === "number" &&
    typeof product.stock === "number" &&
    typeof product.rating === "number" &&
    typeof product.reviewCount === "number" &&
    typeof product.deliveryMinutes === "number" &&
    typeof product.featured === "boolean" &&
    typeof product.bestseller === "boolean" &&
    typeof product.active === "boolean" &&
    Boolean(product.unit) &&
    typeof product.unit?.label === "string" &&
    typeof product.unit?.value === "string"
  );
}

function readStoredProducts(): Product[] {
  try {
    const raw = window.localStorage.getItem(
      STORAGE_KEY
    );

    if (!raw) {
      return cloneDefaultProducts();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return cloneDefaultProducts();
    }

    const validProducts = parsed.filter(isProduct);

    if (validProducts.length === 0) {
      return cloneDefaultProducts();
    }

    return validProducts;
  } catch {
    return cloneDefaultProducts();
  }
}

function createProductId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `prd_${crypto.randomUUID()}`;
  }

  return `prd_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function createUniqueSlug(
  requestedSlug: string,
  products: Product[],
  ignoredProductId?: string
) {
  const baseSlug =
    requestedSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product";

  let slug = baseSlug;
  let counter = 2;

  while (
    products.some(
      (product) =>
        product.slug === slug &&
        product.id !== ignoredProductId
    )
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

function sanitizeProduct(product: Product): Product {
  const mrp = Math.max(
    Number(product.mrp) || 0,
    0
  );

  const price = Math.max(
    Number(product.price) || 0,
    0
  );

  return {
    ...product,
    

images:
  product.images?.filter(
    (img) => img.trim() !== ""
  ) ?? [],
    tags: [...new Set((product.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
    variants: product.variants?.map((variant, index) => {
      const price = Math.max(Number(variant.price) || 0, 0);
      const mrp = Math.max(Number(variant.mrp) || 0, price);
      const stock = Math.max(Math.floor(Number(variant.stock) || 0), 0);
      const images = (variant.images ?? []).map((image) => image.trim()).filter(Boolean);

      return {
        ...variant,
        id: variant.id.trim() || `var_${index + 1}`,
        name: variant.name.trim() || variant.unit.label.trim() || `Variant ${index + 1}`,
        sku: variant.sku.trim() || `${product.slug || "product"}-${index + 1}`.toUpperCase(),
        barcode: variant.barcode?.trim() || undefined,
        color: variant.color?.trim() || undefined,
        size: variant.size?.trim() || undefined,
        weight: variant.weight?.trim() || undefined,
        image: variant.image?.trim() || images[0] || undefined,
        images,
        attributes: Object.fromEntries(
          Object.entries(variant.attributes ?? {}).filter(([key, value]) => key.trim() && value.trim())
        ),
        unit: {
          label: variant.unit.label.trim() || product.unit.label.trim(),
          value: variant.unit.value.trim() || product.unit.value.trim(),
        },
        mrp,
        price,
        stock,
      };
    }) ?? [],
    name: product.name.trim(),
    slug: product.slug.trim(),
    brand: product.brand.trim(),
    categorySlug: product.categorySlug.trim(),
    image: product.image.trim(),
    fallbackIcon:
      product.fallbackIcon.trim() || "📦",
    unit: {
      label: product.unit.label.trim(),
      value: product.unit.value.trim(),
    },
    mrp: Math.max(mrp, price),
    price,
    stock: Math.max(
      Math.floor(Number(product.stock) || 0),
      0
    ),
    rating: Math.min(
      Math.max(Number(product.rating) || 0, 0),
      5
    ),
    reviewCount: Math.max(
      Math.floor(
        Number(product.reviewCount) || 0
      ),
      0
    ),
    deliveryMinutes: Math.max(
      Math.floor(
        Number(product.deliveryMinutes) || 1
      ),
      1
    ),
  };
}

export default function ProductAdminProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {
    setProducts(readStoredProducts());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(products)
      );
    } catch {
      // Storage failure should not break the app.
    }
  }, [products, hydrated]);

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) => product.active
      ),
    [products]
  );

  const getProductById = useCallback(
    (productId: string) =>
      products.find(
        (product) => product.id === productId
      ),
    [products]
  );

  const getProductBySlug = useCallback(
    (
      slug: string,
      includeInactive = false
    ) =>
      products.find(
        (product) =>
          product.slug === slug &&
          (includeInactive || product.active)
      ),
    [products]
  );

  const addProduct = useCallback(
    (input: ProductInput) => {
      let createdProduct: Product | null = null;

      setProducts((current) => {
        const productId =
          input.id?.trim() || createProductId();

        const slug = createUniqueSlug(
          input.slug || input.name,
          current
        );

        createdProduct = sanitizeProduct({
          ...input,
          id: productId,
          slug,
        } as Product);

        return [
          createdProduct,
          ...current.filter(
            (product) =>
              product.id !== productId
          ),
        ];
      });

      if (!createdProduct) {
        throw new Error(
          "Product could not be created."
        );
      }

      return createdProduct;
    },
    []
  );

  const updateProduct = useCallback(
    (
      productId: string,
      updates: Partial<Product>
    ) => {
      let updatedProduct: Product | null = null;

      setProducts((current) =>
        current.map((product) => {
          if (product.id !== productId) {
            return product;
          }

          const requestedSlug =
            updates.slug ??
            updates.name ??
            product.slug;

          const slug = createUniqueSlug(
            requestedSlug,
            current,
            productId
          );

          updatedProduct = sanitizeProduct({
            ...product,
            ...updates,
            id: product.id,
            slug,
            unit: {
              ...product.unit,
              ...(updates.unit ?? {}),
            },
          });

          return updatedProduct;
        })
      );

      return updatedProduct;
    },
    []
  );

  const removeProduct = useCallback(
    (productId: string) => {
      setProducts((current) =>
        current.filter(
          (product) =>
            product.id !== productId
        )
      );
    },
    []
  );

  const toggleProductActive = useCallback(
    (productId: string) => {
      setProducts((current) =>
        current.map((product) =>
          product.id === productId
            ? {
                ...product,
                active: !product.active,
              }
            : product
        )
      );
    },
    []
  );

  const toggleProductFeatured =
    useCallback((productId: string) => {
      setProducts((current) =>
        current.map((product) =>
          product.id === productId
            ? {
                ...product,
                featured: !product.featured,
              }
            : product
        )
      );
    }, []);

  const toggleProductBestseller =
    useCallback((productId: string) => {
      setProducts((current) =>
        current.map((product) =>
          product.id === productId
            ? {
                ...product,
                bestseller:
                  !product.bestseller,
              }
            : product
        )
      );
    }, []);

  const resetProducts = useCallback(() => {
    setProducts(cloneDefaultProducts());
  }, []);

  const value =
    useMemo<ProductAdminContextValue>(
      () => ({
        products,
        activeProducts,
        hydrated,
        getProductById,
        getProductBySlug,
        addProduct,
        updateProduct,
        removeProduct,
        toggleProductActive,
        toggleProductFeatured,
        toggleProductBestseller,
        resetProducts,
      }),
      [
        products,
        activeProducts,
        hydrated,
        getProductById,
        getProductBySlug,
        addProduct,
        updateProduct,
        removeProduct,
        toggleProductActive,
        toggleProductFeatured,
        toggleProductBestseller,
        resetProducts,
      ]
    );

  return (
    <ProductAdminContext.Provider
      value={value}
    >
      {children}
    </ProductAdminContext.Provider>
  );
}
