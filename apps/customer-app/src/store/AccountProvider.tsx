"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AccountContextValue,
  CustomerProfile,
  AuthSession,
  LocalUser,
  UserRole,
} from "@/types/account";
import {
  loginWithBackend,
  logoutFromBackend,
  refreshBackendSession,
  registerWithBackend,
  verifyOtpWithBackend,
  type BackendAuthResult,
} from "@/services/auth.service";
import {
  getSecureAccessToken,
  setSecureAccessToken,
  setSecureRefreshToken,
  getSecureRefreshToken,
  clearSecureAccessToken,
  clearSecureRefreshToken,
} from "@/utils/secureSession";

export const AccountContext = createContext<AccountContextValue | null>(null);

const STORAGE_KEY = "bootkit_customer_profile_v1";
const SESSION_KEY = "bootkit_session_v1";

const emptyProfile: CustomerProfile = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  avatar: "",
  alternatePhone: "",
};

function readStoredProfile(): CustomerProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile;
    const parsed = JSON.parse(raw) as Partial<CustomerProfile>;
    return {
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      dateOfBirth: typeof parsed.dateOfBirth === "string" ? parsed.dateOfBirth : "",
      gender: typeof parsed.gender === "string" ? parsed.gender : "",
      avatar: typeof parsed.avatar === "string" ? parsed.avatar : "",
      alternatePhone:
        typeof parsed.alternatePhone === "string" ? parsed.alternatePhone : "",
    };
  } catch {
    return emptyProfile;
  }
}

function getBackendSession(data: NonNullable<BackendAuthResult["data"]>) {
  const profile: CustomerProfile = {
    fullName: `${data.user.firstName} ${data.user.lastName}`.trim(),
    email: data.user.email ?? "",
    phone: data.user.phone,
    dateOfBirth: "",
  };

  // Explicit role validation: Customer APK must reject non-customer roles
  if (data.user.role !== "CUSTOMER") {
    throw new Error("Management role accounts are not allowed on this app.");
  }

  if (!data.user.isActive) {
    throw new Error("This account is blocked. Please contact support.");
  }

  const session: AuthSession = {
    userId: data.user.id,
    email: data.user.email ?? "",
    role: data.user.role,
    authenticatedAt: new Date().toISOString(),
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };

  return { profile, session, rawRefreshToken: data.refreshToken };
}

export default function AccountProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CustomerProfile>(emptyProfile);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [users, setUsers] = useState<LocalUser[]>([]);

  // Session bootstrap restoration flow
  const restoreSession = useCallback(async () => {
    try {
      const savedSession = JSON.parse(
        window.localStorage.getItem(SESSION_KEY) || "null"
      ) as AuthSession | null;

      const storedToken = getSecureAccessToken();
      const token = savedSession?.accessToken || storedToken;

      if (savedSession && savedSession.userId) {
        const fullSession: AuthSession = {
          ...savedSession,
          accessToken: token || undefined,
        };

        const storedProfile = readStoredProfile();
        setProfile(storedProfile);
        setSession(fullSession);
        if (token) {
          setSecureAccessToken(token);
        }
        setHydrated(true);

        // Silent background refresh if refresh token exists
        const secureRefreshToken = await getSecureRefreshToken();
        if (secureRefreshToken) {
          try {
            const result = await refreshBackendSession(secureRefreshToken);
            if (result.success && result.data) {
              const { profile: nextProfile, session: nextSession, rawRefreshToken } =
                getBackendSession(result.data);

              setProfile(nextProfile);
              setSession(nextSession);
              setSecureAccessToken(result.data.accessToken);
              await setSecureRefreshToken(rawRefreshToken);

              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
              window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
            }
          } catch (err: any) {
            console.warn("Silent background refresh skipped/failed:", err?.message);
          }
        }
        return true;
      }
    } catch (err: any) {
      console.warn("Session restoration failed:", err?.message);
    }

    setSession(null);
    setProfile(emptyProfile);
    setHydrated(true);
    return false;
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const updateProfile = useCallback((nextProfile: CustomerProfile) => {
    setProfile(nextProfile);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    } catch {}
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(emptyProfile);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const register = useCallback(
    async (nextProfile: CustomerProfile, password: string) => {
      const email = nextProfile.email.trim().toLowerCase();
      if (!email || password.length < 8) {
        return {
          success: false,
          message: "Email and password (at least 8 characters) are required.",
        };
      }

      const trimmedName = nextProfile.fullName.trim();
      const firstSpaceIndex = trimmedName.indexOf(" ");
      let firstName = trimmedName;
      let lastName = "";
      if (firstSpaceIndex !== -1) {
        firstName = trimmedName.substring(0, firstSpaceIndex).trim();
        lastName = trimmedName.substring(firstSpaceIndex + 1).trim();
      }

      const result = await registerWithBackend(
        firstName,
        lastName,
        email,
        nextProfile.phone.trim(),
        password
      );

      if (!result.success || !result.data) {
        return { success: false, message: result.message };
      }

      try {
        const { profile: nextProfileData, session: nextSession, rawRefreshToken } =
          getBackendSession(result.data);

        updateProfile(nextProfileData);
        setSecureAccessToken(result.data.accessToken);
        await setSecureRefreshToken(rawRefreshToken);

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfileData));
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
        return { success: true, message: result.message };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
    [updateProfile]
  );

  const login = useCallback(
    async (emailValue: string, password: string) => {
      const email = emailValue.trim().toLowerCase();
      const backendResult = await loginWithBackend(email, password);

      if (backendResult.success && backendResult.data) {
        try {
          const { profile: nextProfile, session: nextSession, rawRefreshToken } =
            getBackendSession(backendResult.data);

          updateProfile(nextProfile);
          setSecureAccessToken(backendResult.data.accessToken);
          await setSecureRefreshToken(rawRefreshToken);

          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
          setSession(nextSession);
          return { success: true, message: backendResult.message };
        } catch (err: any) {
          return { success: false, message: err.message };
        }
      }
      return { success: false, message: backendResult.message || "Login failed." };
    },
    [updateProfile]
  );

  const loginWithOtp = useCallback(
    async (phone: string, otp: string) => {
      const backendResult = await verifyOtpWithBackend(phone, otp);

      if (!backendResult.success || !backendResult.data) {
        return { success: false, message: backendResult.message };
      }

      try {
        const { profile: nextProfile, session: nextSession, rawRefreshToken } =
          getBackendSession(backendResult.data);

        updateProfile(nextProfile);
        setSecureAccessToken(backendResult.data.accessToken);
        await setSecureRefreshToken(rawRefreshToken);

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
        return { success: true, message: backendResult.message };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
    [updateProfile]
  );

  const logout = useCallback(() => {
    // Revoke backend session if access token exists
    const accessToken = getSecureAccessToken();
    if (accessToken) {
      void logoutFromBackend(accessToken);
    }
    window.localStorage.removeItem(SESSION_KEY);
    clearSecureAccessToken();
    void clearSecureRefreshToken();
    setSession(null);
    setProfile(emptyProfile);
  }, []);

  const updateUserRole = useCallback((email: string, role: UserRole) => {
    return { success: false, message: "Management functions disabled on Customer APK." };
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      profile,
      hydrated,
      updateProfile,
      clearProfile,
      session,
      users,
      register,
      login,
      loginWithOtp,
      logout,
      updateUserRole,
    }),
    [
      profile,
      hydrated,
      updateProfile,
      clearProfile,
      session,
      users,
      register,
      login,
      loginWithOtp,
      logout,
      updateUserRole,
    ]
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}
