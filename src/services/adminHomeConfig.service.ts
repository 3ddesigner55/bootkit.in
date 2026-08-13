export type AdminBestSellersConfigItem = {
  category: string;
  productMode: "auto" | "manual";
  manualProductIds?: string[];
  active: boolean;
  sortOrder: number;
};

export type AdminBestSellersConfig = {
  key: string;
  title: string;
  active: boolean;
  displayType: string;
  items: AdminBestSellersConfigItem[];
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    "",
  );

  return `${baseUrl}${path}`;
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
    throw new Error(payload.message || "Home configuration request failed.");
  }

  return payload.data;
}

export async function getAdminBestSellersConfig(
  accessToken: string,
): Promise<AdminBestSellersConfig> {
  return request<AdminBestSellersConfig>(
    "/admin/home-config/best-sellers",
    accessToken,
  );
}

export async function updateAdminBestSellersConfig(
  accessToken: string,
  config: Partial<AdminBestSellersConfig>,
): Promise<AdminBestSellersConfig> {
  return request<AdminBestSellersConfig>(
    "/admin/home-config/best-sellers",
    accessToken,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    },
  );
}
