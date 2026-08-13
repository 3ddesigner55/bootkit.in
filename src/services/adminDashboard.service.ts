export type DashboardOverviewMetrics = {
  totalOrders: number;
  orderGrowthPercent: number;
  gmv: number;
  gmvGrowthPercent: number;
  aov: number;
  activeUsers: number | null;
};

export type DashboardOverviewData = {
  generatedAt: string;
  filters: {
    hubId: string;
    range: string;
    timezone: string;
  };
  metrics: DashboardOverviewMetrics;
  capabilities: {
    activeUsersAvailable: boolean;
    riderMetricsAvailable: boolean;
    paymentReconciliationAvailable: boolean;
    supportTicketsAvailable: boolean;
  };
};

export type KanbanOrder = {
  _id: string;
  orderNumber: string;
  store: {
    _id: string;
    name: string;
  };
  createdAt: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    thumbnail: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  paymentStatus: string;
  rider?: {
    _id: string;
    name: string;
  } | null;
  statusHistory?: Array<{
    newStatus: string;
    timestamp: string;
  }>;
};

export type DashboardLiveOperations = {
  kanban: {
    newOrders: KanbanOrder[];
    packing: KanbanOrder[];
    ready: KanbanOrder[];
    transit: KanbanOrder[];
    deliveredLastHour: KanbanOrder[];
  };
  riders: {
    active: number;
    available: number;
    onTrip: number;
    offline: number;
    stale: number;
  };
  alerts: {
    outOfStock: Array<{
      id: string;
      productName: string;
      sku: string;
      thumbnail: string;
      stock: number;
    }>;
    lowStock: Array<{
      id: string;
      productName: string;
      sku: string;
      thumbnail: string;
      stock: number;
    }>;
  };
};

export type DashboardActionsData = {
  delayedOrders: KanbanOrder[];
  paymentFailures: Array<{
    id: string;
    orderNumber: string;
    amount: number;
    reason: string;
    timestamp: string;
  }>;
  supportTickets: Array<{
    id: string;
    ticketNumber: string;
    category: string;
    customerName: string;
    timestamp: string;
  }>;
};

export type GroupedSearchResult = {
  orders: Array<{
    _id: string;
    orderNumber: string;
    status: string;
    grandTotal: number;
  }>;
  customers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  }>;
  products: Array<{
    _id: string;
    name: string;
    sku: string;
    thumbnail: string;
  }>;
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    ""
  );
  return `${baseUrl}${path}`;
}

async function request<T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.message || "Dashboard request failed.");
  }
  return payload.data;
}

export async function getAdminDashboardOverview(accessToken: string, range: string, hubId: string) {
  return request<DashboardOverviewData>(
    `/admin/dashboard/overview?range=${range}&hubId=${hubId}`,
    accessToken
  );
}

export async function getAdminDashboardLiveOperations(accessToken: string, hubId: string) {
  return request<DashboardLiveOperations>(
    `/admin/dashboard/live-operations?hubId=${hubId}`,
    accessToken
  );
}

export async function getAdminDashboardActions(accessToken: string, hubId: string) {
  return request<DashboardActionsData>(
    `/admin/dashboard/actions?hubId=${hubId}`,
    accessToken
  );
}

export async function getAdminGlobalSearch(accessToken: string, query: string) {
  return request<GroupedSearchResult>(
    `/admin/dashboard/search?q=${encodeURIComponent(query)}`,
    accessToken
  );
}

export async function hideStoreInventoryItem(accessToken: string, inventoryId: string, reason: string) {
  return request<any>(
    `/admin/store-inventory/${inventoryId}/adjust`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false, reason }),
    }
  );
}
