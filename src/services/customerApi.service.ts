import {
  toCustomerBrand,
  toCustomerCategory,
  toCustomerHeroBanner,
  toCustomerProduct,
  toCustomerStore,
  toCustomerBestSellerItem,
} from "./customerApi.mappers";
import type {
  CustomerBrand,
  CustomerCatalogParams,
  CustomerCatalogResult,
  CustomerCategory,
  CustomerHeroBanner,
  CustomerHomeData,
  CustomerPagination,
  CustomerProductDetails,
  CustomerSearchResult,
  CustomerStore,
  CustomerStoreParams,
} from "./customerApi.types";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type ApiRecord = Record<string, unknown>;

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    ""
  );

  return `${baseUrl}${path}`;
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(getApiUrl(path));
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.message || "Customer API request failed.");
  }

  return payload.data;
}

function asRecord(value: unknown, entity: string): ApiRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${entity} response is invalid.`);
  }

  return value as ApiRecord;
}

function asArray(value: unknown, entity: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${entity} response is invalid.`);
  }

  return value;
}

function toPagination(value: unknown): CustomerPagination {
  const record = asRecord(value, "Pagination");
  const keys = ["page", "limit", "total", "totalPages"] as const;

  for (const key of keys) {
    if (typeof record[key] !== "number" || !Number.isFinite(record[key])) {
      throw new Error(`Pagination response is missing ${key}.`);
    }
  }

  return {
    page: record.page as number,
    limit: record.limit as number,
    total: record.total as number,
    totalPages: record.totalPages as number,
  };
}

function appendQuery(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, value);
    }
  }

  const queryString = query.toString();

  return queryString ? `${path}?${queryString}` : path;
}

export async function getCustomerHomeData(
  storeId?: string,
  city?: string
): Promise<CustomerHomeData> {
  const data = asRecord(
    await request<unknown>(
      appendQuery("/home", {
        storeId,
        city,
      })
    ),
    "Home"
  );

  const mapProducts = (key: string) =>
    asArray(data[key], `Home ${key}`).map(toCustomerProduct);
  const mapCategories = (key: string) =>
    asArray(data[key], `Home ${key}`).map(toCustomerCategory);

  return {
    resolvedStoreId: typeof data.resolvedStoreId === "string" ? data.resolvedStoreId : null,
    config: data.config ? (data.config as any) : null,
    heroBanners: asArray(data.heroBanners, "Home heroBanners").map(
      toCustomerHeroBanner
    ),
    bestSellers: asArray(data.bestSellers, "Home bestSellers").map(
      toCustomerBestSellerItem
    ),
    groceryKitchen: mapCategories("groceryKitchen"),
    householdEssentials: mapCategories("householdEssentials"),

    sweetTooth: mapProducts("sweetTooth"),
    featuredThisWeek: asArray(data.featuredThisWeek, "Home featuredThisWeek").map(
      toCustomerHeroBanner
    ),
    snacksDrinks: mapCategories("snacksDrinks"),
    beautyPersonalCare: mapCategories("beautyPersonalCare"),
    storeSpotlight: asArray(data.storeSpotlight, "Home storeSpotlight").map(
      toCustomerStore
    ),
  };
}


export async function getCustomerHeroBanners(): Promise<CustomerHeroBanner[]> {
  return asArray(
    await request<unknown>("/hero-banners"),
    "Hero banners"
  ).map(toCustomerHeroBanner);
}

export async function getCustomerCatalogProducts(
  params: CustomerCatalogParams = {}
): Promise<CustomerCatalogResult> {
  const data = asRecord(
    await request<unknown>(
      appendQuery("/products", {
        page: params.page?.toString(),
        limit: params.limit?.toString(),
        storeId: params.storeId,
        search: params.search,
        category: params.category,
        brand: params.brand,
        featured: params.featured?.toString(),
        showOnHome: params.showOnHome?.toString(),
        minPrice: params.minPrice?.toString(),
        maxPrice: params.maxPrice?.toString(),
        sort: params.sort,
      })
    ),
    "Catalog"
  );

  return {
    items: asArray(data.items, "Catalog items").map(toCustomerProduct),
    pagination: toPagination(data.pagination),
  };
}

export async function getCustomerProductBySlug(
  slug: string,
  storeId?: string
): Promise<CustomerProductDetails> {
  const data = asRecord(
    await request<unknown>(
      appendQuery(`/products/slug/${encodeURIComponent(slug)}`, {
        storeId,
      })
    ),
    "Product details"
  );

  return {
    product: toCustomerProduct(data.product),
    category: data.category ? toCustomerCategory(data.category) : null,
    brand: data.brand ? toCustomerBrand(data.brand) : null,
    relatedProducts: asArray(data.relatedProducts, "Related products").map(
      toCustomerProduct
    ),
  };
}

export async function getCustomerCategories(): Promise<CustomerCategory[]> {
  return asArray(await request<unknown>("/categories"), "Categories").map(
    toCustomerCategory
  );
}

export async function getCustomerBrands(): Promise<CustomerBrand[]> {
  return asArray(await request<unknown>("/brands"), "Brands").map(
    toCustomerBrand
  );
}

export async function getCustomerStores(
  params: CustomerStoreParams = {}
): Promise<{ items: CustomerStore[]; pagination: CustomerPagination }> {
  const data = asRecord(
    await request<unknown>(
      appendQuery("/stores", {
        page: params.page?.toString(),
        limit: params.limit?.toString(),
        city: params.city,
        state: params.state,
        featured: params.featured?.toString(),
        sort: params.sort,
      })
    ),
    "Stores"
  );

  return {
    items: asArray(data.items, "Store items").map(toCustomerStore),
    pagination: toPagination(data.pagination),
  };
}

export async function searchCustomerCatalog(
  q: string,
  params: { page?: number; limit?: number } = {}
): Promise<CustomerSearchResult> {
  const data = asRecord(
    await request<unknown>(
      appendQuery("/search", {
        q,
        page: params.page?.toString(),
        limit: params.limit?.toString(),
      })
    ),
    "Search"
  );
  const meta = asRecord(data.meta, "Search metadata");
  const totals = asRecord(meta.totals, "Search totals");

  return {
    products: asArray(data.products, "Search products").map(toCustomerProduct),
    categories: asArray(data.categories, "Search categories").map(
      toCustomerCategory
    ),
    brands: asArray(data.brands, "Search brands").map(toCustomerBrand),
    stores: asArray(data.stores, "Search stores").map(toCustomerStore),
    meta: {
      ...toPagination(meta),
      q: typeof meta.q === "string" ? meta.q : q,
      totals: {
        products: typeof totals.products === "number" ? totals.products : 0,
        categories: typeof totals.categories === "number" ? totals.categories : 0,
        brands: typeof totals.brands === "number" ? totals.brands : 0,
        stores: typeof totals.stores === "number" ? totals.stores : 0,
      },
    },
  };
}

export async function getCustomerCategoryTree(): Promise<any[]> {
  return request<any[]>("/categories/tree");
}

export async function getCustomerCategoryBySlug(slug: string): Promise<any> {
  return request<any>(`/categories/slug/${encodeURIComponent(slug)}`);
}

export async function getCustomerCategoryProducts(
  slug: string,
  params: {
    storeId?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<any> {
  return request<any>(
    appendQuery(`/categories/slug/${encodeURIComponent(slug)}/products`, {
      storeId: params.storeId,
      brand: params.brand,
      minPrice: params.minPrice?.toString(),
      maxPrice: params.maxPrice?.toString(),
      sort: params.sort,
      page: params.page?.toString(),
      limit: params.limit?.toString(),
    })
  );
}

