import type { Brand } from "@/types/brand";

type BrandPayload = Omit<Brand, "id">;

type BackendBrand = BrandPayload & {
  _id?: string;
  id?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type AdminBrandsData = {
  brands: BackendBrand[];
  pagination: Pagination;
};

export type AdminBrandListParams = {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  featured?: boolean;
  sort?: "displayOrder" | "name" | "createdAt";
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    "",
  );

  return `${baseUrl}${path}`;
}

function toBrand(brand: BackendBrand): Brand {
  const id = brand.id || brand._id;

  if (!id) {
    throw new Error("Brand response is missing an identifier.");
  }

  return {
    id,
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo,
    banner: brand.banner ?? "",
    collectionHub: brand.collectionHub ?? null,
    description: brand.description,
    active: brand.active,
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
    throw new Error(payload.message || "Brand request failed.");
  }

  return payload.data;
}

export async function getAdminBrands(
  accessToken: string,
  params: AdminBrandListParams = {},
) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 12),
    sort: params.sort ?? "displayOrder",
  });

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.active !== undefined) {
    searchParams.set("active", String(params.active));
  }

  if (params.featured !== undefined) {
    searchParams.set("featured", String(params.featured));
  }

  const data = await request<AdminBrandsData>(
    `/admin/brands?${searchParams.toString()}`,
    accessToken,
  );

  return {
    brands: data.brands.map(toBrand),
    pagination: data.pagination,
  };
}

export async function createAdminBrand(
  accessToken: string,
  brand: BrandPayload,
) {
  const data = await request<BackendBrand>("/admin/brands", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brand),
  });

  return toBrand(data);
}

export async function updateAdminBrand(
  accessToken: string,
  brandId: string,
  brand: Partial<BrandPayload>,
) {
  const data = await request<BackendBrand>(
    `/admin/brands/${brandId}`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brand),
    },
  );

  return toBrand(data);
}

export async function deleteAdminBrand(accessToken: string, brandId: string) {
  await request<BackendBrand>(`/admin/brands/${brandId}`, accessToken, {
    method: "DELETE",
  });
}

export async function uploadAdminBrandImages(
  accessToken: string,
  files: { logo?: File; banner?: File },
) {
  const formData = new FormData();
  if (files.logo) formData.append("logo", files.logo);
  if (files.banner) formData.append("banner", files.banner);

  return request<{ logo?: string; banner?: string }>(
    "/admin/brands/upload",
    accessToken,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function uploadAdminBrandLogo(accessToken: string, logo: File) {
  const res = await uploadAdminBrandImages(accessToken, { logo });
  return { logo: res.logo || "" };
}
