import type { Category } from "@/types/category";

type CategoryPayload = Omit<Category, "id">;

type BackendCategory = CategoryPayload & {
  _id?: string;
  id?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminCategoriesData = {
  categories: BackendCategory[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type AdminCategoryListParams = {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  sort?: "displayOrder" | "sortOrder" | "name" | "createdAt";
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    "",
  );

  return `${baseUrl}${path}`;
}

function toCategory(category: BackendCategory): Category {
  const id = category.id || category._id;

  if (!id) {
    throw new Error("Category response is missing an identifier.");
  }

  return {
    id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    background: category.background,
    image: category.image,
    banner: category.banner,
    featured: category.featured,
    active: category.active,
    sortOrder: category.sortOrder,
    showOnHome: category.showOnHome,
    homeLayout: category.homeLayout,
    displayOrder: category.displayOrder,
    collectionHub:
      category.collectionHub === null ||
      typeof category.collectionHub === "string"
        ? category.collectionHub
        : null,
    homeSection:
      category.homeSection === null || typeof category.homeSection === "string"
        ? (category.homeSection as Category["homeSection"])
        : null,
    parentCategory: category.parentCategory ?? null,
    level: category.level,
    hierarchyPath: category.hierarchyPath,
    ancestors: category.ancestors,
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
    throw new Error(payload.message || "Category request failed.");
  }

  return payload.data;
}

export async function getAdminCategories(
  accessToken: string,
  params: AdminCategoryListParams = {},
) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 100),
    sort: params.sort ?? "sortOrder",
  });

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.active !== undefined) {
    searchParams.set("active", String(params.active));
  }

  const data = await request<AdminCategoriesData>(
    `/admin/categories?${searchParams.toString()}`,
    accessToken,
  );

  return {
    categories: data.categories.map(toCategory),
    pagination: data.pagination,
  };
}

export async function createAdminCategory(
  accessToken: string,
  category: CategoryPayload,
) {
  const data = await request<BackendCategory>(
    "/admin/categories",
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    },
  );

  return toCategory(data);
}

export async function updateAdminCategory(
  accessToken: string,
  categoryId: string,
  category: Partial<CategoryPayload>,
) {
  const data = await request<BackendCategory>(
    `/admin/categories/${categoryId}`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    },
  );

  return toCategory(data);
}

export async function deleteAdminCategory(
  accessToken: string,
  categoryId: string,
) {
  await request<BackendCategory>(
    `/admin/categories/${categoryId}`,
    accessToken,
    {
      method: "DELETE",
    },
  );
}

export async function uploadAdminCategoryImages(
  accessToken: string,
  files: { image?: File; banner?: File },
) {
  const formData = new FormData();

  if (files.image) {
    formData.append("image", files.image);
  }

  if (files.banner) {
    formData.append("banner", files.banner);
  }

  return request<{ image?: string; banner?: string }>(
    "/admin/categories/upload",
    accessToken,
    {
      method: "POST",
      body: formData,
    },
  );
}
