import type { UserRole } from "@/types/account";

type BackendUser = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  role: UserRole;
};

type BackendAuthData = {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
};

type BackendResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type BackendAuthResult = {
  success: boolean;
  message: string;
  data?: BackendAuthData;
};

type SendOtpData = {
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
};

function getApiUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
    /\/$/,
    "",
  );

  return `${baseUrl}${path}`;
}

async function requestAuth<T>(
  path: string,
  init: RequestInit,
): Promise<{ success: boolean; message: string; data?: T }> {
  try {
    const response = await fetch(getApiUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    const payload = (await response.json()) as BackendResponse<T>;

    return {
      success: response.ok && payload.success,
      message: payload.message || "Authentication request failed.",
      data: payload.data,
    };
  } catch {
    return {
      success: false,
      message: "Authentication service is unavailable.",
    };
  }
}

export async function loginWithBackend(
  email: string,
  password: string,
): Promise<BackendAuthResult> {
  return requestAuth<BackendAuthData>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshBackendSession(
  refreshToken: string,
): Promise<BackendAuthResult> {
  return requestAuth<BackendAuthData>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function sendOtpWithBackend(
  phone: string,
): Promise<{ success: boolean; message: string; data?: SendOtpData }> {
  return requestAuth<SendOtpData>("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtpWithBackend(
  phone: string,
  otp: string,
): Promise<BackendAuthResult> {
  return requestAuth<BackendAuthData>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, otp }),
  });
}

export async function logoutFromBackend(accessToken: string): Promise<void> {
  await requestAuth("/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function registerWithBackend(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  password: string,
): Promise<BackendAuthResult> {
  return requestAuth<BackendAuthData>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName, email, phone, password }),
  });
}

export async function forgotPasswordWithBackend(
  email: string,
): Promise<{ success: boolean; message: string }> {
  return requestAuth("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordWithBackend(
  token: string,
  password: string,
): Promise<{ success: boolean; message: string }> {
  return requestAuth("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
