type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type BackendProduct = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  thumbnail?: string;
  unit?: string | { label: string; value: string };
  sku?: string;
  mrp?: number;
  sellingPrice?: number;
  stock?: number;
  fallbackIcon?: string;
};

type BackendStore = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  active: boolean;
};

export type BackendStoreInventoryItem = {
  _id?: string;
  id?: string;
  store: BackendStore | string;
  product: BackendProduct | string;
  variantSku?: string;
  stock: number;
  reservedStock: number;
  availableStock?: number;
  sellingPrice: number;
  mrp: number;
  costPrice?: number;
  discountPercent?: number;
  active: boolean;
  trackInventory: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminStoreInventoryData = {
  items: BackendStoreInventoryItem[];
  pagination: Pagination;
};

export type AdminStoreInventoryItem = {
  id: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productSlug: string;
  productThumbnail: string;
  productUnitLabel: string;
  productFallbackIcon: string;
  variantSku: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  sellingPrice: number;
  mrp: number;
  costPrice?: number;
  discountPercent?: number;
  active: boolean;
  trackInventory: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminStoreInventoryListParams = {
  page?: number;
  limit?: number;
  storeId?: string;
  productId?: string;
  search?: string;
  active?: boolean;
  lowStock?: boolean;
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    ""
  );
  return `${baseUrl}${path}`;
}

export function toStoreInventoryItem(
  item: BackendStoreInventoryItem
): AdminStoreInventoryItem {
  const id = item.id || item._id || "";
  const store = typeof item.store === "object" ? item.store : null;
  const product = typeof item.product === "object" ? item.product : null;

  const productUnitLabel = product?.unit
    ? typeof product.unit === "object"
      ? product.unit.label
      : String(product.unit)
    : "Unit";

  return {
    id,
    storeId: store?.id || store?._id || (typeof item.store === "string" ? item.store : ""),
    storeName: store?.name || "Store",
    productId: product?.id || product?._id || (typeof item.product === "string" ? item.product : ""),
    productName: product?.name || "Product",
    productSlug: product?.slug || "",
    productThumbnail: product?.thumbnail || "",
    productUnitLabel,
    productFallbackIcon: product?.fallbackIcon || "📦",
    variantSku: item.variantSku || "",
    stock: item.stock ?? 0,
    reservedStock: item.reservedStock ?? 0,
    availableStock:
      item.availableStock !== undefined
        ? item.availableStock
        : Math.max(0, (item.stock ?? 0) - (item.reservedStock ?? 0)),
    sellingPrice: item.sellingPrice ?? 0,
    mrp: item.mrp ?? 0,
    costPrice: item.costPrice,
    discountPercent: item.discountPercent,
    active: item.active ?? true,
    trackInventory: item.trackInventory ?? true,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

async function request<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
) {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.message || "Store inventory request failed.");
  }

  return payload.data;
}

export async function getAdminStoreInventories(
  accessToken: string,
  params: AdminStoreInventoryListParams = {}
): Promise<{ items: AdminStoreInventoryItem[]; pagination: Pagination }> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
  });

  if (params.storeId) query.set("storeId", params.storeId);
  if (params.productId) query.set("productId", params.productId);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.active !== undefined) query.set("active", String(params.active));
  if (params.lowStock !== undefined)
    query.set("lowStock", String(params.lowStock));

  const data = await request<AdminStoreInventoryData>(
    `/admin/store-inventory?${query.toString()}`,
    accessToken
  );

  return {
    items: data.items.map(toStoreInventoryItem),
    pagination: data.pagination,
  };
}

export async function getAdminStoreInventoryById(
  accessToken: string,
  id: string
): Promise<AdminStoreInventoryItem> {
  const data = await request<BackendStoreInventoryItem>(
    `/admin/store-inventory/${id}`,
    accessToken
  );
  return toStoreInventoryItem(data);
}

export async function createAdminStoreInventory(
  accessToken: string,
  payload: {
    storeId: string;
    productId: string;
    variantSku?: string;
    stock: number;
    reservedStock?: number;
    sellingPrice: number;
    mrp: number;
    costPrice?: number;
    discountPercent?: number;
    active?: boolean;
    trackInventory?: boolean;
  }
): Promise<AdminStoreInventoryItem> {
  const data = await request<BackendStoreInventoryItem>(
    "/admin/store-inventory",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  return toStoreInventoryItem(data);
}

export async function updateAdminStoreInventory(
  accessToken: string,
  id: string,
  payload: Partial<{
    stock: number;
    reservedStock: number;
    sellingPrice: number;
    mrp: number;
    costPrice: number;
    discountPercent: number;
    active: boolean;
    trackInventory: boolean;
  }>
): Promise<AdminStoreInventoryItem> {
  const data = await request<BackendStoreInventoryItem>(
    `/admin/store-inventory/${id}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return toStoreInventoryItem(data);
}

export async function deleteAdminStoreInventory(
  accessToken: string,
  id: string
): Promise<{ id: string; deleted: boolean }> {
  return request<{ id: string; deleted: boolean }>(
    `/admin/store-inventory/${id}`,
    accessToken,
    {
      method: "DELETE",
    }
  );
}
