type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type BackendCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  isActive: boolean;
  status: "Active" | "Blocked";
  isVerified: boolean;
  registeredAt: string;
  updatedAt: string;
  orderCount: number;
  totalSpend: number;
  latestOrderDate: string | null;
};

export type AdminCustomer = BackendCustomer & {
  fullName: string;
};

export type AdminCustomerAddress = {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
};

export type AdminCustomerOrderSummary = {
  orderCount: number;
  totalOrders: number;
  totalSpend: number;
  latestOrderDate: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminCustomersData = {
  items: BackendCustomer[];
  pagination: Pagination;
};

type AdminCustomerOrdersData = {
  items: unknown[];
  summary: AdminCustomerOrderSummary;
  pagination: Pagination;
};

export type AdminCustomerListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "Active" | "Blocked";
  sort?: "newest" | "oldest" | "nameAsc" | "nameDesc" | "ordersDesc" | "totalSpendDesc";
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    ""
  );

  return `${baseUrl}${path}`;
}

function toCustomer(customer: BackendCustomer): AdminCustomer {
  return {
    ...customer,
    fullName: `${customer.firstName} ${customer.lastName}`.trim(),
  };
}

async function request<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
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
    throw new Error(payload.message || "Customer request failed.");
  }

  return payload.data;
}

export async function getAdminCustomers(
  accessToken: string,
  params: AdminCustomerListParams = {}
) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 4),
    sort: params.sort ?? "newest",
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status) query.set("status", params.status);

  const data = await request<AdminCustomersData>(
    `/admin/customers?${query.toString()}`,
    accessToken
  );

  return {
    customers: data.items.map(toCustomer),
    pagination: data.pagination,
  };
}

export async function getAdminCustomer(accessToken: string, customerId: string) {
  return toCustomer(
    await request<BackendCustomer>(`/admin/customers/${customerId}`, accessToken)
  );
}

export async function getAdminCustomerAddresses(
  accessToken: string,
  customerId: string
) {
  return request<AdminCustomerAddress[]>(
    `/admin/customers/${customerId}/addresses`,
    accessToken
  );
}

export async function getAdminCustomerOrders(
  accessToken: string,
  customerId: string,
  params: { page?: number; limit?: number } = {}
) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  return request<AdminCustomerOrdersData>(
    `/admin/customers/${customerId}/orders?${query.toString()}`,
    accessToken
  );
}

export async function updateAdminCustomerStatus(
  accessToken: string,
  customerId: string,
  status: "Active" | "Blocked"
) {
  return request<Pick<BackendCustomer, "id" | "isActive" | "status">>(
    `/admin/customers/${customerId}/status`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
}
