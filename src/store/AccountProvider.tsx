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
import { supabase } from "@/lib/supabase/client";
import {
  loginWithBackend,
  logoutFromBackend,
  refreshBackendSession,
  registerWithBackend,
  verifyOtpWithBackend,
  type BackendAuthResult,
} from "@/services/auth.service";

export const AccountContext = createContext<AccountContextValue | null>(null);

const STORAGE_KEY = "bootkit_customer_profile_v1";
const USERS_KEY = "bootkit_users_v1";
const SESSION_KEY = "bootkit_session_v1";
function readUsers(): LocalUser[] {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(USERS_KEY) || "[]",
    ) as Partial<LocalUser>[];
    return parsed
      .filter((user) => user.profile?.email)
      .map((user) => ({
        profile: user.profile as CustomerProfile,
        passwordHash: user.passwordHash || "",
        role: user.role === "ADMIN"
          ? "ADMIN"
          : user.role === "OWNER"
            ? "OWNER"
            : user.role === "SELLER"
              ? "SELLER"
              : "CUSTOMER",
        createdAt: user.createdAt || new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}


const emptyProfile: CustomerProfile = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
};

type SupabaseProfile = {
  full_name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  created_at: string;
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
      dateOfBirth:
        typeof parsed.dateOfBirth === "string" ? parsed.dateOfBirth : "",
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
  const session: AuthSession = {
    userId: data.user.id,
    email: data.user.email ?? "",
    role: data.user.role,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    authenticatedAt: new Date().toISOString(),
  };

  return { profile, session };
}

export default function AccountProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CustomerProfile>(emptyProfile);

  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [users, setUsers] = useState<LocalUser[]>([]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = JSON.parse(
          window.localStorage.getItem(SESSION_KEY) || "null",
        ) as AuthSession | null;

        if (savedSession?.accessToken) {
          setProfile(readStoredProfile());
          setSession(savedSession);
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      }
      setUsers(readUsers());
      setHydrated(true);
    };

    void restoreSession();
  }, []);

  useEffect(() => {
  if (typeof window === "undefined") {
    return;
  }

  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    if (response.status !== 401) {
      return response;
    }

    const input = args[0];
    const requestInit = args[1];

    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const headers = new Headers(
      input instanceof Request
        ? input.headers
        : undefined,
    );

    if (requestInit?.headers) {
      new Headers(requestInit.headers).forEach(
        (value, key) => {
          headers.set(key, value);
        },
      );
    }

    const authorization =
      headers.get("Authorization");

    const isAuthenticatedRequest =
      authorization?.startsWith("Bearer ") === true;

    const isAuthEndpoint = url.includes("/auth/");

    // Public/background 401 must never log out a valid customer.
    if (!isAuthenticatedRequest || isAuthEndpoint) {
      return response;
    }

    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);

    if (
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.assign(
        `/login?next=${encodeURIComponent(
          window.location.pathname,
        )}`,
      );
    }

    return response;
  };

  return () => {
    window.fetch = originalFetch;
  };
}, []);

  const updateProfile = useCallback((nextProfile: CustomerProfile) => {
    setProfile(nextProfile);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    } catch {
      // Storage failure should not break profile editing.
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(emptyProfile);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failure.
    }
  }, []);

  const digest = async (value: string) => {
    const data = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((item) => item.toString(16).padStart(2, "0"))
      .join("");
  };
  const register = useCallback(
    async (nextProfile: CustomerProfile, password: string) => {
      const email = nextProfile.email.trim().toLowerCase();
      if (!email || password.length < 8)
        return {
          success: false,
          message: "Email और कम से कम 8 अक्षर का password आवश्यक है।",
        };

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
        password,
      );

      if (!result.success || !result.data) {
        return { success: false, message: result.message };
      }

      const { profile: nextProfileData, session: nextSession } =
        getBackendSession(result.data);

      updateProfile(nextProfileData);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);

      return { success: true, message: result.message };
    },
    [updateProfile],
  );
  const login = useCallback(
    async (emailValue: string, password: string) => {
      const email = emailValue.trim().toLowerCase();
      const backendResult = await loginWithBackend(email, password);

      if (backendResult.success && backendResult.data) {
        const { profile: nextProfile, session: nextSession } =
          getBackendSession(backendResult.data);

        updateProfile(nextProfile);
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
        return { success: true, message: backendResult.message, role: nextSession.role };
      }

      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error || !data.user?.email)
          return {
            success: false,
            message: error?.message || "Login नहीं हो सका।",
          };
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, phone, role, created_at")
          .eq("id", data.user.id)
          .maybeSingle<SupabaseProfile>();
        const role = profile?.role || "CUSTOMER";
        updateProfile({
          fullName:
            profile?.full_name ||
            String(data.user.user_metadata.full_name || ""),
          email: data.user.email,
          phone: profile?.phone || String(data.user.user_metadata.phone || ""),
          dateOfBirth: "",
        });
        const nextSession = {
          userId: data.user.id,
          email: data.user.email,
          role,
          accessToken: data.session?.access_token,
          refreshToken: data.session?.refresh_token,
          authenticatedAt: data.user.created_at || new Date().toISOString(),
        };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
        return { success: true, message: "Login सफल है।" };
      }
      const users = readUsers();
      const user = users.find(
        (item) => item.profile.email.toLowerCase() === email,
      );
      if (!user || user.passwordHash !== (await digest(password)))
        return { success: false, message: "Email या password सही नहीं है।" };
      const role: UserRole = user.role;
      updateProfile(user.profile);
      const nextSession: AuthSession = {
        email,
        role,
        authenticatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      return { success: true, message: "Login सफल है।" };
    },
    [updateProfile],
  );
  const loginWithOtp = useCallback(
    async (phone: string, otp: string) => {
      const backendResult = await verifyOtpWithBackend(phone, otp);

      if (!backendResult.success || !backendResult.data) {
        return { success: false, message: backendResult.message };
      }

      const { profile: nextProfile, session: nextSession } = getBackendSession(
        backendResult.data,
      );

      updateProfile(nextProfile);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);

      return { success: true, message: backendResult.message };
    },
    [updateProfile],
  );
  const logout = useCallback(() => {
    if (session?.accessToken) {
      void logoutFromBackend(session.accessToken);
    }
    if (supabase) void supabase.auth.signOut();
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setUsers([]);
  }, [session]);
  const updateUserRole = useCallback(
    (email: string, role: UserRole) => {
      if (session?.role !== "OWNER")
        return {
          success: false,
          message: "केवल owner user roles बदल सकता है।",
        };
      const normalizedEmail = email.toLowerCase();
      if (supabase) {
        void supabase
          .from("profiles")
          .update({ role })
          .eq("email", normalizedEmail);
        setUsers((currentUsers) =>
          currentUsers.map((user) =>
            user.profile.email.toLowerCase() === normalizedEmail
              ? { ...user, role }
              : user,
          ),
        );
        return { success: true, message: "User role update हो गया।" };
      }
      const nextUsers = users.map((user) =>
        user.profile.email.toLowerCase() === normalizedEmail
          ? { ...user, role }
          : user,
      );
      if (nextUsers.every((user, index) => user === users[index]))
        return { success: false, message: "User नहीं मिला।" };
      setUsers(nextUsers);
      try {
        window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
      } catch {
        return { success: false, message: "Role save नहीं हो सका।" };
      }
      return { success: true, message: "User role update हो गया।" };
    },
    [session?.role, users],
  );

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
    ],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}
