import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function percentageOff(
  mrp: number,
  salePrice: number
) {
  return Math.round(((mrp - salePrice) / mrp) * 100);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function normalizeEnvelope<T>(
  response: any,
  keyFallback?: string
): {
  success: boolean;
  message?: string;
  items: T[];
  data: any;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} {
  const result = {
    success: false,
    message: "",
    items: [] as T[],
    data: null as any,
    pagination: {
      page: 1,
      limit: 15,
      total: 0,
      totalPages: 1,
    },
  };

  if (!response) return result;

  // Case 1: Response itself is an array
  if (Array.isArray(response)) {
    result.success = true;
    result.items = response;
    result.data = response;
    result.pagination.total = response.length;
    result.pagination.totalPages = 1;
    return result;
  }

  result.success = !!response.success;
  result.message = response.message || "";

  // Extract data block
  const data = response.data;

  if (data !== undefined && data !== null) {
    result.data = data;
    // Case 2: { success, data: { items: [], pagination } }
    if (data.items && Array.isArray(data.items)) {
      result.items = data.items;
    }
    // Case 3: { success, data: [] }
    else if (Array.isArray(data)) {
      result.items = data;
    }
  }

  // Case 4: Legacy flat keyed arrays (e.g. response.customers or automatic detection)
  if (result.items.length === 0) {
    if (keyFallback && Array.isArray(response[keyFallback])) {
      result.items = response[keyFallback];
    } else {
      const arrayKey = Object.keys(response).find(
        (k) => k !== "data" && Array.isArray(response[k])
      );
      if (arrayKey) {
        result.items = response[arrayKey];
      }
    }
  }

  // Case 5: Nested or flat/legacy pagination properties
  const page = Number(
    data?.pagination?.page ||
      response?.pagination?.page ||
      data?.page ||
      response?.page ||
      1
  );
  const limit = Number(
    data?.pagination?.limit ||
      response?.pagination?.limit ||
      data?.limit ||
      response?.limit ||
      15
  );
  const total = Number(
    data?.pagination?.total ||
      response?.pagination?.total ||
      data?.pagination?.totalCount ||
      response?.pagination?.totalCount ||
      data?.total ||
      response?.total ||
      data?.totalCount ||
      response?.totalCount ||
      result.items.length
  );
  const totalPages = Number(
    data?.pagination?.totalPages ||
      response?.pagination?.totalPages ||
      data?.totalPages ||
      response?.totalPages ||
      Math.ceil(total / limit) ||
      1
  );

  result.pagination = { page, limit, total, totalPages };

  return result;
}