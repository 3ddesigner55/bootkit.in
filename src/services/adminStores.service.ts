type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type BackendStore = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  email?: string;
  phone: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  managerName?: string;
  managerPhone?: string;
  deliveryRadius?: number;
  active: boolean;
  featured?: boolean;
  displayOrder?: number;
  openingTime?: string;
  closingTime?: string;
  latitude?: number;
  longitude?: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminStoresData = {
  items: BackendStore[];
  pagination: Pagination;
};

export type AdminStoreData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  managerName: string;
  managerPhone: string;
  deliveryRadius: number;
  active: boolean;
  featured: boolean;
  displayOrder: number;
  openingTime: string;
  closingTime: string;
  latitude: number;
  longitude: number;
};

export type AdminStorePayload = Omit<AdminStoreData, "id">;

export type AdminStoreListParams = {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  featured?: boolean;
  sort?: "newest" | "oldest" | "name-asc" | "display-order";
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    ""
  );

  return `${baseUrl}${path}`;
}

function toStore(store: BackendStore): AdminStoreData {
  const id = store.id || store._id;

  if (!id) throw new Error("Store response is missing an identifier.");

  return {
    id,
    name: store.name,
    slug: store.slug,
    description: store.description ?? "",
    logo: store.logo ?? "",
    banner: store.banner ?? "",
    email: store.email ?? "",
    phone: store.phone,
    addressLine1: store.addressLine1 ?? "",
    addressLine2: store.addressLine2 ?? "",
    city: store.city,
    state: store.state,
    country: store.country,
    postalCode: store.postalCode ?? "",
    managerName: store.managerName ?? "",
    managerPhone: store.managerPhone ?? "",
    deliveryRadius: store.deliveryRadius ?? 0,
    active: store.active,
    featured: store.featured ?? false,
    displayOrder: store.displayOrder ?? 0,
    openingTime: store.openingTime ?? "",
    closingTime: store.closingTime ?? "",
    latitude: store.latitude ?? 0,
    longitude: store.longitude ?? 0,
  };
}

async function request<T>(path: string, accessToken: string, init: RequestInit = {}) {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.message || "Store request failed.");
  }

  return payload.data;
}

export async function getAdminStores(accessToken: string, params: AdminStoreListParams = {}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 4),
    sort: params.sort ?? "display-order",
  });
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.active !== undefined) query.set("active", String(params.active));
  if (params.featured !== undefined) query.set("featured", String(params.featured));

  const data = await request<AdminStoresData>(
    `/admin/stores?${query.toString()}`,
    accessToken
  );

  return { stores: data.items.map(toStore), pagination: data.pagination };
}

export async function getAdminStore(accessToken: string, storeId: string) {
  return toStore(await request<BackendStore>(`/admin/stores/${storeId}`, accessToken));
}

export async function createAdminStore(accessToken: string, store: AdminStorePayload) {
  return toStore(
    await request<BackendStore>("/admin/stores", accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    })
  );
}

export async function updateAdminStore(
  accessToken: string,
  storeId: string,
  store: Partial<AdminStorePayload>
) {
  return toStore(
    await request<BackendStore>(`/admin/stores/${storeId}`, accessToken, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    })
  );
}

export async function deleteAdminStore(accessToken: string, storeId: string) {
  await request<BackendStore>(`/admin/stores/${storeId}`, accessToken, {
    method: "DELETE",
  });
}

export async function uploadAdminStoreImages(
  accessToken: string,
  files: { logo?: File; banner?: File }
) {
  const formData = new FormData();
  if (files.logo) formData.append("logo", files.logo);
  if (files.banner) formData.append("banner", files.banner);

  return request<{ logo?: string; banner?: string }>(
    "/admin/stores/upload",
    accessToken,
    { method: "POST", body: formData }
  );
}
