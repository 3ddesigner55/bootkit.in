type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type BusinessSettings = {
  minimumOrderValue: number;
  baseDeliveryFee: number;
  freeDeliveryThreshold: number;
};

export type TaxProfile = {
  _id: string;
  name: string;
  taxRate: number;
  priceMode: 'TAX_INCLUSIVE' | 'TAX_EXCLUSIVE';
  intraStateSplitRatio: number;
  active: boolean;
};

export type StaffMember = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  status: 'ACTIVE' | 'BLOCKED' | 'INVITED';
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    ""
  );
  return `${baseUrl}${path}`;
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
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed.");
  }
  return payload.data as T;
}

export async function getBusinessSettings(accessToken: string): Promise<BusinessSettings> {
  return request<BusinessSettings>("/admin/settings/business", accessToken);
}

export async function updateBusinessSettings(accessToken: string, settings: BusinessSettings): Promise<BusinessSettings> {
  return request<BusinessSettings>("/admin/settings/business", accessToken, {
    method: "POST",
    body: JSON.stringify(settings),
  });
}

export async function getTaxProfiles(accessToken: string): Promise<TaxProfile[]> {
  return request<TaxProfile[]>("/admin/settings/taxes", accessToken);
}

export async function createTaxProfile(accessToken: string, profile: Omit<TaxProfile, "_id">): Promise<TaxProfile> {
  return request<TaxProfile>("/admin/settings/taxes", accessToken, {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function updateTaxProfile(accessToken: string, id: string, profile: Partial<TaxProfile>): Promise<TaxProfile> {
  return request<TaxProfile>(`/admin/settings/taxes/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

export async function getStaffMembers(accessToken: string): Promise<StaffMember[]> {
  return request<StaffMember[]>("/admin/settings/staff", accessToken);
}

export async function inviteStaffMember(accessToken: string, invite: { email: string; role: string; assignedStores?: string[] }): Promise<any> {
  return request<any>("/admin/settings/staff/invite", accessToken, {
    method: "POST",
    body: JSON.stringify(invite),
  });
}

export async function updateStaffRole(accessToken: string, staffId: string, role: string): Promise<any> {
  return request<any>(`/admin/settings/staff/${staffId}/role`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function blockStaffMember(accessToken: string, staffId: string): Promise<any> {
  return request<any>(`/admin/settings/staff/${staffId}/block`, accessToken, {
    method: "PATCH",
  });
}

export async function unblockStaffMember(accessToken: string, staffId: string): Promise<any> {
  return request<any>(`/admin/settings/staff/${staffId}/unblock`, accessToken, {
    method: "PATCH",
  });
}
