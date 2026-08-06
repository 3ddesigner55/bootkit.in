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

export const AccountContext =
  createContext<AccountContextValue | null>(null);

const STORAGE_KEY = "bootkit_customer_profile_v1";
const USERS_KEY = "bootkit_users_v1";
const SESSION_KEY = "bootkit_session_v1";
// Local development allowlist only. Move roles to the server before production.
const LOCAL_OWNER_EMAILS = new Set(["3ddesigner5546@gmail.com"]);

function readUsers(): LocalUser[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USERS_KEY) || "[]") as Partial<LocalUser>[];
    return parsed.filter((user) => user.profile?.email).map((user) => ({
      profile: user.profile as CustomerProfile,
      passwordHash: user.passwordHash || "",
      role: LOCAL_OWNER_EMAILS.has(user.profile!.email.toLowerCase()) ? "OWNER" : user.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
      createdAt: user.createdAt || new Date().toISOString(),
    }));
  } catch { return []; }
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
  const [users, setUsers] = useState<LocalUser[]>([]);

  useEffect(() => {
    if (supabase) {
      const client = supabase;
      void client.auth.getUser().then(async ({ data: { user } }) => {
        if (!user || (!user.email && !user.phone)) { setHydrated(true); return; }
        const { data } = await client.from("profiles").select("full_name, email, phone, role, created_at").eq("id", user.id).maybeSingle<SupabaseProfile>();
        const nextProfile = { fullName: data?.full_name || String(user.user_metadata.full_name || ""), email: data?.email || user.email || user.phone || "", phone: data?.phone || user.phone || String(user.user_metadata.phone || ""), dateOfBirth: "" };
        const role = data?.role || "CUSTOMER";
        setProfile(nextProfile);
        setSession({ email: user.email || user.phone || "", role, authenticatedAt: user.created_at });
        if (role === "OWNER") {
          const { data: allProfiles } = await client.from("profiles").select("full_name, email, phone, role, created_at").order("created_at", { ascending: false });
          setUsers((allProfiles || []).map((profile) => ({ profile: { fullName: profile.full_name, email: profile.email || profile.phone, phone: profile.phone, dateOfBirth: "" }, passwordHash: "", role: profile.role as UserRole, createdAt: profile.created_at })));
        }
        setHydrated(true);
      });
      return;
    }
    setProfile(readStoredProfile());
    try {
      const savedSession = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null") as AuthSession | null;
      const normalizedSession = savedSession && LOCAL_OWNER_EMAILS.has(savedSession.email.toLowerCase()) ? { ...savedSession, role: "OWNER" as const } : savedSession;
      setSession(normalizedSession);
      if (normalizedSession) window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalizedSession));
    } catch { setSession(null); }
    setUsers(readUsers());
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
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: nextProfile.fullName, phone: nextProfile.phone } } });
      if (error) return { success: false, message: error.message };
      if (!data.session) return { success: true, message: "Account बन गया। Email verify करके login करें।" };
      setProfile({ ...nextProfile, email });
      setSession({ email, role: "CUSTOMER", authenticatedAt: new Date().toISOString() });
      return { success: true, message: "Account तैयार है।" };
    }
    const users = readUsers();
    if (users.some((user) => user.profile.email.toLowerCase() === email)) return { success: false, message: "इस email से account पहले से मौजूद है।" };
    const profile = { ...nextProfile, email };
    const role: UserRole = LOCAL_OWNER_EMAILS.has(email) ? "OWNER" : "CUSTOMER";
    users.push({ profile, passwordHash: await digest(password), role, createdAt: new Date().toISOString() });
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users)); setUsers(users); updateProfile(profile);
    const nextSession: AuthSession = { email, role, authenticatedAt: new Date().toISOString() };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)); setSession(nextSession);
    return { success: true, message: "Account तैयार है।" };
  }, [updateProfile]);
  const login = useCallback(async (emailValue: string, password: string) => {
    const email = emailValue.trim().toLowerCase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user?.email) return { success: false, message: error?.message || "Login नहीं हो सका।" };
      const { data: profile } = await supabase.from("profiles").select("full_name, email, phone, role, created_at").eq("id", data.user.id).maybeSingle<SupabaseProfile>();
      const role = profile?.role || "CUSTOMER";
      updateProfile({ fullName: profile?.full_name || String(data.user.user_metadata.full_name || ""), email: data.user.email, phone: profile?.phone || String(data.user.user_metadata.phone || ""), dateOfBirth: "" });
      setSession({ email: data.user.email, role, authenticatedAt: data.user.created_at });
      return { success: true, message: "Login सफल है।" };
    }
    const users = readUsers();
    const user = users.find((item) => item.profile.email.toLowerCase() === email);
    if (!user || user.passwordHash !== await digest(password)) return { success: false, message: "Email या password सही नहीं है।" };
    const role: UserRole = LOCAL_OWNER_EMAILS.has(email) ? "OWNER" : user.role;
    updateProfile(user.profile); const nextSession: AuthSession = { email, role, authenticatedAt: new Date().toISOString() }; window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)); setSession(nextSession); return { success: true, message: "Login सफल है।" };
  }, [updateProfile]);
  const logout = useCallback(() => { if (supabase) void supabase.auth.signOut(); window.localStorage.removeItem(SESSION_KEY); setSession(null); setUsers([]); }, []);
  const updateUserRole = useCallback((email: string, role: UserRole) => {
    if (session?.role !== "OWNER") return { success: false, message: "केवल owner user roles बदल सकता है।" };
    const normalizedEmail = email.toLowerCase();
    if (LOCAL_OWNER_EMAILS.has(normalizedEmail)) return { success: false, message: "Owner role बदला नहीं जा सकता।" };
    if (supabase) {
      void supabase.from("profiles").update({ role }).eq("email", normalizedEmail);
      setUsers((currentUsers) => currentUsers.map((user) => user.profile.email.toLowerCase() === normalizedEmail ? { ...user, role } : user));
      return { success: true, message: "User role update हो गया।" };
    }
    const nextUsers = users.map((user) => user.profile.email.toLowerCase() === normalizedEmail ? { ...user, role } : user);
    if (nextUsers.every((user, index) => user === users[index])) return { success: false, message: "User नहीं मिला।" };
    setUsers(nextUsers);
    try { window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers)); } catch { return { success: false, message: "Role save नहीं हो सका।" }; }
    return { success: true, message: "User role update हो गया।" };
  }, [session?.role, users]);

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
