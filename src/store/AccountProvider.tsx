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
} from "@/types/account";

export const AccountContext =
  createContext<AccountContextValue | null>(null);

const STORAGE_KEY = "bootkit_customer_profile_v1";
const USERS_KEY = "bootkit_users_v1";
const SESSION_KEY = "bootkit_session_v1";
// Local development allowlist only. Move roles to the server before production.
const LOCAL_ADMIN_EMAILS = new Set(["3ddesigner5546@gmail.com"]);

const emptyProfile: CustomerProfile = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
};

function readStoredProfile(): CustomerProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return emptyProfile;

    const parsed = JSON.parse(raw) as Partial<CustomerProfile>;

    return {
      fullName:
        typeof parsed.fullName === "string"
          ? parsed.fullName
          : "",
      phone:
        typeof parsed.phone === "string"
          ? parsed.phone
          : "",
      email:
        typeof parsed.email === "string"
          ? parsed.email
          : "",
      dateOfBirth:
        typeof parsed.dateOfBirth === "string"
          ? parsed.dateOfBirth
          : "",
    };
  } catch {
    return emptyProfile;
  }
}

export default function AccountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] =
    useState<CustomerProfile>(emptyProfile);

  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setProfile(readStoredProfile());
    try { setSession(JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null") as AuthSession | null); } catch { setSession(null); }
    setHydrated(true);
  }, []);

  const updateProfile = useCallback(
    (nextProfile: CustomerProfile) => {
      setProfile(nextProfile);

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nextProfile)
        );
      } catch {
        // Storage failure should not break profile editing.
      }
    },
    []
  );

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
    return Array.from(new Uint8Array(hash)).map((item) => item.toString(16).padStart(2, "0")).join("");
  };
  const register = useCallback(async (nextProfile: CustomerProfile, password: string) => {
    const email = nextProfile.email.trim().toLowerCase();
    if (!email || password.length < 8) return { success: false, message: "Email और कम से कम 8 अक्षर का password आवश्यक है।" };
    const users = JSON.parse(window.localStorage.getItem(USERS_KEY) || "[]") as Array<{ profile: CustomerProfile; passwordHash: string; role: AuthSession["role"] }>;
    if (users.some((user) => user.profile.email.toLowerCase() === email)) return { success: false, message: "इस email से account पहले से मौजूद है।" };
    const profile = { ...nextProfile, email };
    const role = LOCAL_ADMIN_EMAILS.has(email) ? "ADMIN" : "CUSTOMER";
    users.push({ profile, passwordHash: await digest(password), role });
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users)); updateProfile(profile);
    const nextSession: AuthSession = { email, role, authenticatedAt: new Date().toISOString() };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)); setSession(nextSession);
    return { success: true, message: "Account तैयार है।" };
  }, [updateProfile]);
  const login = useCallback(async (emailValue: string, password: string) => {
    const email = emailValue.trim().toLowerCase();
    const users = JSON.parse(window.localStorage.getItem(USERS_KEY) || "[]") as Array<{ profile: CustomerProfile; passwordHash: string; role: AuthSession["role"] }>;
    const user = users.find((item) => item.profile.email.toLowerCase() === email);
    if (!user || user.passwordHash !== await digest(password)) return { success: false, message: "Email या password सही नहीं है।" };
    const role = LOCAL_ADMIN_EMAILS.has(email) ? "ADMIN" : user.role;
    updateProfile(user.profile); const nextSession: AuthSession = { email, role, authenticatedAt: new Date().toISOString() }; window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)); setSession(nextSession); return { success: true, message: "Login सफल है।" };
  }, [updateProfile]);
  const logout = useCallback(() => { window.localStorage.removeItem(SESSION_KEY); setSession(null); }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      profile,
      hydrated,
      updateProfile,
      clearProfile,
      session,
      register,
      login,
      logout,
    }),
    [
      profile,
      hydrated,
      updateProfile,
      clearProfile,
      session,
      register,
      login,
      logout,
    ]
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}
