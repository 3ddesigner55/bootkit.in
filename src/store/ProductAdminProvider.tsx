"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { formatPrice } from "@/lib/utils";
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

type DatabaseProduct = {
  id: string; name: string; slug: string; brand: string; category_slug: string; image_url: string | null; fallback_icon: string; unit_label: string; unit_value: string; mrp: number; price: number; stock: number; rating: number; review_count: number; delivery_minutes: number; featured: boolean; bestseller: boolean; active: boolean;
};

function fromDatabaseProduct(product: DatabaseProduct): Product {
  return { id: product.id, name: product.name, slug: product.slug, brand: product.brand, categorySlug: product.category_slug, image: product.image_url || "", fallbackIcon: product.fallback_icon, unit: { label: product.unit_label, value: product.unit_value }, mrp: Number(product.mrp), price: Number(product.price), stock: product.stock, rating: Number(product.rating), reviewCount: product.review_count, deliveryMinutes: product.delivery_minutes, featured: product.featured, bestseller: product.bestseller, active: product.active, description: "", gallery: product.image_url ? [product.image_url] : [], thumbnail: product.image_url || "", sku: "", barcode: "", showOnHome: false, displayOrder: 0, variants: [] };
}

function toDatabaseProduct(product: Product) {
  return { id: product.id, name: product.name, slug: product.slug, brand: product.brand, category_slug: product.categorySlug, image_url: product.image || null, fallback_icon: product.fallbackIcon, unit_label: product.unit.label, unit_value: product.unit.value, mrp: product.mrp, price: product.price, stock: product.stock, rating: product.rating, review_count: product.reviewCount, delivery_minutes: product.deliveryMinutes, featured: product.featured, bestseller: product.bestseller, active: product.active };
}

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
    typeof product.description === "string" &&
    Array.isArray(product.gallery) &&
    product.gallery.every((image) => typeof image === "string") &&
    (product.thumbnail === undefined || typeof product.thumbnail === "string") &&
    typeof product.sku === "string" &&
    typeof product.barcode === "string" &&
    typeof product.showOnHome === "boolean" &&
    typeof product.displayOrder === "number" &&
    
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
    return crypto.randomUUID();
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
    description: product.description.trim(),
    gallery: product.gallery.filter((image) => image.trim() !== ""),
    thumbnail: product.thumbnail?.trim() || "",
    sku: product.sku.trim(),
    barcode: product.barcode.trim(),
    showOnHome: product.showOnHome,
    displayOrder: Math.max(Math.floor(Number(product.displayOrder) || 0), 0),
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

 const getBackendConfig = useCallback(() => {
  if (typeof window === "undefined") {
    return {
      apiBase: "",
      token: "",
      role: "",
    };
  }

  const rawSession =
    window.localStorage.getItem("bootkit_session_v1");

  const session = rawSession
    ? JSON.parse(rawSession)
    : null;

  const token = session?.accessToken || "";
  const role =
    typeof session?.role === "string"
      ? session.role
      : "";

  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
  ).replace(/\/$/, "");

  return {
    apiBase,
    token,
    role,
  };
}, []);

  useEffect(() => {
    const loadProducts = async () => {
     try {
  const { apiBase, token, role } =
    getBackendConfig();

  if (role !== "ADMIN" && role !== "OWNER") {
    setProducts(readStoredProducts());
    setHydrated(true);
    return;
  }

  if (!apiBase) {
          setProducts(readStoredProducts());
          setHydrated(true);
          return;
        }

        const res = await fetch(`${apiBase}/admin/products?limit=1000`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const payload = await res.json();
        if (payload?.success && Array.isArray(payload.data?.items)) {
          const mapped = payload.data.items.map((p: any) => ({
            id: p._id || p.id,
            name: p.name,
            slug: p.slug,
            brand: p.brandName || p.brand?.name || "",
            categorySlug: p.categorySlug || p.category?.slug || "",
            image: p.thumbnail || p.image_url || "",
            fallbackIcon: p.fallbackIcon || "",
            unit: {
              label: p.unit || "g",
              value: p.weight || 0,
            },
            mrp: p.mrp || p.sellingPrice,
            price: p.sellingPrice,
            stock: p.stock || 0,
            rating: p.rating || 4.5,
            reviewCount: p.reviewCount || 0,
            deliveryMinutes: p.deliveryMinutes || 10,
            featured: !!p.featured,
            bestseller: !!p.bestseller,
            active: !!p.active,
          }));
          setProducts(mapped);
        } else {
          setProducts(readStoredProducts());
        }
      } catch (err) {
        setProducts(readStoredProducts());
      }
      setHydrated(true);
    };
    void loadProducts();
  }, [getBackendConfig]);

  useEffect(() => {
    if (!hydrated) return;
    const { apiBase } = getBackendConfig();
    if (apiBase) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(products)
      );
    } catch {
      // Storage failure should not break the app.
    }
  }, [products, hydrated, getBackendConfig]);

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

      const { apiBase, token } = getBackendConfig();
      if (apiBase && token && createdProduct) {
        void fetch(`${apiBase}/admin/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: (createdProduct as Product).name,
            slug: (createdProduct as Product).slug,
            sellingPrice: (createdProduct as Product).price,
            mrp: (createdProduct as Product).mrp,
            stock: (createdProduct as Product).stock,
            active: (createdProduct as Product).active,
          }),
        });
      }

      return createdProduct;
    },
    [getBackendConfig]
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

      const { apiBase, token } = getBackendConfig();
      if (updatedProduct && apiBase && token) {
        void fetch(`${apiBase}/admin/products/${productId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            active: (updatedProduct as Product).active,
            featured: (updatedProduct as Product).featured,
            stock: (updatedProduct as Product).stock,
            sellingPrice: (updatedProduct as Product).price,
            mrp: (updatedProduct as Product).mrp,
          }),
        });
      }

      return updatedProduct;
    },
    [getBackendConfig]
  );

  const removeProduct = useCallback(
    (productId: string) => {
      setProducts((current) =>
        current.filter(
          (product) =>
            product.id !== productId
        )
      );
      const { apiBase, token } = getBackendConfig();
      if (apiBase && token) {
        void fetch(`${apiBase}/admin/products/${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    },
    [getBackendConfig]
  );

  const toggleProductActive = useCallback(
    (productId: string) => {
      const product = products.find((item) => item.id === productId);
      if (product) updateProduct(productId, { active: !product.active });
    },
    [products, updateProduct]
  );

  const toggleProductFeatured =
    useCallback((productId: string) => {
      const product = products.find((item) => item.id === productId);
      if (product) updateProduct(productId, { featured: !product.featured });
    }, [products, updateProduct]);

  const toggleProductBestseller =
    useCallback((productId: string) => {
      const product = products.find((item) => item.id === productId);
      if (product) updateProduct(productId, { bestseller: !product.bestseller });
    }, [products, updateProduct]);

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
