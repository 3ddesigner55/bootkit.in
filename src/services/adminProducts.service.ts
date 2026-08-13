import type { Product, ProductVariant } from "@/types/product";

type BackendCategory = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};

type BackendBrand = {
  _id?: string;
  id?: string;
  name?: string;
};

type BackendProductVariant = Omit<ProductVariant, "id"> & {
  _id?: string;
  id?: string;
};

type BackendProduct = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  category?: BackendCategory | null;
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  brand?: BackendBrand | null;
  brandId?: string | null;
  brandName?: string | null;
  mrp?: number;
  sellingPrice: number;
  sku?: string;
  barcode?: string;
  stock: number;
  thumbnail?: string;
  gallery?: string[];
  variants?: BackendProductVariant[];
  tags?: string[];
  fallbackIcon?: string;
  featured?: boolean;
  bestseller?: boolean;
  active?: boolean;
  showOnHome?: boolean;
  displayOrder?: number;
  weight?: number;
  unit?: string;
  deliveryMinutes?: number;
  attributes?: { label: string; value: string }[];
  highlights?: string[];
  videoUrl?: string;
  ingredients?: string;
  storageInstructions?: string;
  usageInstructions?: string;
  replacementPolicy?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminProductsData = {
  items: BackendProduct[];
  pagination: Pagination;
};

export type AdminProduct = Omit<
  Product,
  "rating" | "reviewCount" | "deliveryMinutes"
> & {
  rating?: number;
  reviewCount?: number;
  deliveryMinutes?: number;
  categoryId: string | null;
  brandId: string | null;
};

export type ProductOption = {
  id: string;
  name: string;
  slug?: string;
};

export type AdminProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  active?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  stockStatus?: "in-stock" | "out-of-stock" | "low-stock";
  sort?:
    | "newest"
    | "oldest"
    | "price-asc"
    | "price-desc"
    | "name-asc"
    | "name-desc"
    | "stock-asc"
    | "stock-desc"
    | "display-order";
};

export type AdminProductPayload = {
  name: string;
  slug: string;
  description?: string;
  category: string;
  brand?: string;
  mrp?: number;
  sellingPrice: number;
  sku?: string;
  barcode?: string;
  stock: number;
  thumbnail?: string;
  gallery?: string[];
  variants?: ProductVariant[];
  tags?: string[];
  fallbackIcon?: string;
  featured?: boolean;
  bestseller?: boolean;
  active?: boolean;
  showOnHome?: boolean;
  displayOrder?: number;
  weight?: number;
  unit?: string;
  deliveryMinutes?: number;
  attributes?: { label: string; value: string }[];
  highlights?: string[];
  videoUrl?: string;
  ingredients?: string;
  storageInstructions?: string;
  usageInstructions?: string;
  replacementPolicy?: string;
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    "",
  );

  return `${baseUrl}${path}`;
}

function getId(value: { _id?: string; id?: string }) {
  return value.id || value._id || "";
}

function toProductVariant(variant: BackendProductVariant): ProductVariant {
  return {
    ...variant,
    id: getId(variant),
  };
}

function toAdminProduct(product: BackendProduct): AdminProduct {
  const id = getId(product);

  if (!id) {
    throw new Error("Product response is missing an identifier.");
  }

  const gallery = product.gallery ?? [];
  const thumbnail = product.thumbnail ?? "";
  const weight = product.weight ?? 0;
  const unit = product.unit ?? "";

  return {
    id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    brand: product.brandName ?? product.brand?.name ?? "",
    categorySlug: product.categorySlug ?? product.category?.slug ?? "",
    categoryId: product.categoryId ?? (getId(product.category ?? {}) || null),
    brandId: product.brandId ?? (getId(product.brand ?? {}) || null),
    image: thumbnail || gallery[0] || "",
    images: gallery,
    gallery,
    thumbnail,
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    fallbackIcon: product.fallbackIcon ?? "",
    unit: {
      label: [weight || undefined, unit].filter(Boolean).join(" "),
      value: unit,
    },
    mrp: product.mrp ?? 0,
    price: product.sellingPrice,
    stock: product.stock,
    deliveryMinutes: product.deliveryMinutes,
    featured: product.featured ?? false,
    bestseller: product.bestseller ?? false,
    showOnHome: product.showOnHome ?? false,
    displayOrder: product.displayOrder ?? 0,
    active: product.active ?? false,
    variants: product.variants?.map(toProductVariant),
    tags: product.tags,
    attributes: product.attributes,
    highlights: product.highlights,
    videoUrl: product.videoUrl,
    ingredients: product.ingredients,
    storageInstructions: product.storageInstructions,
    usageInstructions: product.usageInstructions,
    replacementPolicy: product.replacementPolicy,
  };
}

async function request<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.message || "Product request failed.");
  }

  return payload.data;
}

export async function getAdminProducts(
  accessToken: string,
  params: AdminProductListParams = {},
) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
    sort: params.sort ?? "display-order",
  });

  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.category) searchParams.set("category", params.category);
  if (params.brand) searchParams.set("brand", params.brand);
  if (params.active !== undefined)
    searchParams.set("active", String(params.active));
  if (params.featured !== undefined)
    searchParams.set("featured", String(params.featured));
  if (params.bestseller !== undefined)
    searchParams.set("bestseller", String(params.bestseller));
  if (params.stockStatus) searchParams.set("stockStatus", params.stockStatus);

  const data = await request<AdminProductsData>(
    `/admin/products?${searchParams.toString()}`,
    accessToken,
  );

  return {
    products: data.items.map(toAdminProduct),
    pagination: data.pagination,
  };
}

export async function getAdminCategoryOptions(accessToken: string) {
  return request<ProductOption[]>("/admin/categories/options", accessToken);
}

export async function getAdminBrandOptions(accessToken: string) {
  return request<ProductOption[]>("/admin/brands/options", accessToken);
}

export async function createAdminProduct(
  accessToken: string,
  product: AdminProductPayload,
) {
  const data = await request<BackendProduct>("/admin/products", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });

  return toAdminProduct(data);
}

export async function updateAdminProduct(
  accessToken: string,
  productId: string,
  product: Partial<AdminProductPayload>,
) {
  const data = await request<BackendProduct>(
    `/admin/products/${productId}`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    },
  );

  return toAdminProduct(data);
}

export async function deleteAdminProduct(
  accessToken: string,
  productId: string,
) {
  await request<BackendProduct>(`/admin/products/${productId}`, accessToken, {
    method: "DELETE",
  });
}

export async function uploadAdminProductImages(
  accessToken: string,
  files: { thumbnail?: File; gallery?: File[] },
) {
  const formData = new FormData();

  if (files.thumbnail) formData.append("thumbnail", files.thumbnail);
  files.gallery?.forEach((file) => formData.append("gallery", file));

  return request<{ thumbnail?: string; gallery?: string[] }>(
    "/admin/products/upload",
    accessToken,
    { method: "POST", body: formData },
  );
}

export type CsvRowPreview = {
  index: number;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
  data?: Record<string, unknown>;
  raw: Record<string, string>;
};

export type CsvImportResult = {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  rows: CsvRowPreview[];
};

export async function validateAdminProductCsv(
  accessToken: string,
  file: File,
): Promise<CsvImportResult> {
  const formData = new FormData();
  formData.append("csv", file);

  return request<CsvImportResult>(
    "/admin/products/import/validate",
    accessToken,
    { method: "POST", body: formData },
  );
}

export async function confirmAdminProductImport(
  accessToken: string,
  products: Record<string, unknown>[],
  action: "skip" | "update",
): Promise<{ importedCount: number }> {
  return request<{ importedCount: number }>(
    "/admin/products/import/confirm",
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products, action }),
    },
  );
}

export async function getAdminProductById(
  accessToken: string,
  productId: string,
) {
  const data = await request<BackendProduct>(
    `/admin/products/${productId}`,
    accessToken,
  );
  return toAdminProduct(data);
}
