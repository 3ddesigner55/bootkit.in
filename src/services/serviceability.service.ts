import { getApiBaseUrl } from "./api";

export type ServiceabilityResult = {
  serviceable: boolean;
  reason?: string;
  storeId?: string;
  storeName?: string;
  estimatedDeliveryMinutes?: number;
  deliveryFee?: number;
  minimumOrderAmountOverride?: number;
};

type ServiceabilityApiResponse = {
  success: boolean;
  message?: string;
  data?: ServiceabilityResult;
};

export async function resolveServiceabilityByPincode(
  pincode: string,
): Promise<ServiceabilityResult> {
  const normalizedPincode = pincode.replace(/\D/g, "").slice(0, 6);

  if (!/^\d{6}$/.test(normalizedPincode)) {
    throw new Error("Please enter a valid 6-digit pincode.");
  }

  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(
    `${apiBaseUrl}/customer/serviceability/resolve?pincode=${encodeURIComponent(
      normalizedPincode,
    )}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const payload = (await response
    .json()
    .catch(() => null)) as ServiceabilityApiResponse | null;

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(
      payload?.message || "Unable to check delivery availability.",
    );
  }

  return payload.data;
}