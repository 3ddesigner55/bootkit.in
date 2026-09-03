"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAccount } from "@/hooks/useAccount";

function getSafeAdminTarget(): string {
  if (typeof window === "undefined") return "/admin";

  const next = new URLSearchParams(window.location.search).get("next");

  return next === "/admin" || next?.startsWith("/admin/")
    ? next
    : "/admin";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { hydrated, session, login } = useAccount();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAdminAccess =
    Boolean(session?.accessToken) &&
    (session?.role === "ADMIN" || session?.role === "OWNER");

  useEffect(() => {
    if (hydrated && hasAdminAccess) {
      router.replace(getSafeAdminTarget());
    }
  }, [hasAdminAccess, hydrated, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        setError(result.message);
        return;
      }

      const role =
        "role" in result && typeof result.role === "string"
          ? result.role
          : "";

      if (role !== "ADMIN" && role !== "OWNER") {
        setError("This account does not have Admin access.");
        return;
      }

      router.replace(getSafeAdminTarget());
    } catch {
      setError("Unable to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7F5] px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-[#DDE7E0] bg-white p-7 shadow-xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">
          <ShieldCheck size={24} />
        </div>

        <h1 className="mt-5 text-2xl font-black">BootKiT Admin</h1>

        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Admin या Owner account से login करें।
        </p>

        <label className="mt-6 block text-xs font-bold">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] px-4 text-sm outline-none focus:border-[var(--primary)]"
          />
        </label>

        <label className="mt-4 block text-xs font-bold">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] px-4 text-sm outline-none focus:border-[var(--primary)]"
          />
        </label>

        {error ? (
          <p className="mt-3 text-xs font-bold text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-sm font-black text-white disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Login to Admin"
          )}
        </button>
      </form>
    </main>
  );
}