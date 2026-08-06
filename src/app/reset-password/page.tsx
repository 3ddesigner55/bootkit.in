"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter(); const searchParams = useSearchParams(); const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [ready, setReady] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (!supabase) return; const client = supabase; const code = searchParams.get("code"); const restore = async () => { if (code) await client.auth.exchangeCodeForSession(code); const { data } = await client.auth.getSession(); if (!data.session) setError("Reset link invalid या expire हो गया है। नया link भेजें।"); else setReady(true); }; void restore(); }, [searchParams]);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (password.length < 8) return setError("Password कम से कम 8 characters का होना चाहिए।"); if (password !== confirmPassword) return setError("Passwords match नहीं करते।"); if (!supabase) return setError("Supabase connection configured नहीं है।"); const client = supabase; const { error } = await client.auth.updateUser({ password }); if (error) return setError(error.message); router.replace("/login"); };
  return <div className="min-h-screen bg-[var(--background)]"><Header /><Container className="py-10"><form onSubmit={submit} className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]"><h1 className="text-2xl font-black">Choose new password</h1><p className="mt-1 text-sm text-[var(--text-muted)]">अपने account के लिए नया secure password बनाएं।</p>{ready && <><label className="mt-6 block text-xs font-bold">New password<input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm" /></label><label className="mt-4 block text-xs font-bold">Confirm password<input type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm" /></label></>}{error && <p className="mt-4 text-xs font-bold text-[var(--danger)]">{error}</p>}{ready && <button className="mt-6 h-12 w-full rounded-xl bg-[var(--primary)] text-sm font-black text-white">Update password</button>}<p className="mt-4 text-center text-xs"><Link href="/forgot-password" className="font-black text-[var(--primary)]">Request a new link</Link></p></form></Container></div>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}><ResetPasswordForm /></Suspense>;
}
