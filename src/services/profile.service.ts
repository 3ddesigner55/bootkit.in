import { getApiBaseUrl } from "./api";

export type BackendProfileData = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  avatar?: string;
  role: string;
  customerCode?: string;
};

export type ProfileServiceResult<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

export async function fetchBackendProfile(
  accessToken: string,
): Promise<ProfileServiceResult<BackendProfileData>> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
      return {
        success: false,
        message: payload.message || "Failed to fetch profile.",
      };
    }

    return {
      success: true,
      message: "Profile fetched successfully.",
      data: payload.profile || payload.data,
    };
  } catch {
    return {
      success: false,
      message: "Profile service is unavailable.",
    };
  }
}

export async function updateBackendProfile(
  accessToken: string,
  input: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  },
): Promise<ProfileServiceResult<BackendProfileData>> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
      return {
        success: false,
        message: payload.message || "Failed to update profile.",
      };
    }

    return {
      success: true,
      message: payload.message || "Profile updated successfully.",
      data: payload.profile || payload.data,
    };
  } catch {
    return {
      success: false,
      message: "Profile service is unavailable.",
    };
  }
}
