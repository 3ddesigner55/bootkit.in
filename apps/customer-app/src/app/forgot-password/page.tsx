"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (!supabase) return setError("Supabase connection configured नहीं है।");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (error) return setError(error.message);
    setMessage("अगर यह email registered है, तो reset link भेज दिया गया है। Inbox और spam folder check करें।");
  };
  return <div className="min-h-screen bg-[var(--background)]"><Header /><Container className="py-10"><form onSubmit={submit} className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]"><h1 className="text-2xl font-black">Reset password</h1><p className="mt-1 text-sm text-[var(--text-muted)]">अपना email डालें, हम आपको secure reset link भेजेंगे।</p><label className="mt-6 block text-xs font-bold">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm" /></label>{error && <p className="mt-3 text-xs font-bold text-[var(--danger)]">{error}</p>}{message && <p className="mt-3 text-xs font-bold text-[var(--success)]">{message}</p>}<button className="mt-6 h-12 w-full rounded-xl bg-[var(--primary)] text-sm font-black text-white">Send reset link</button><p className="mt-4 text-center text-xs"><Link href="/login" className="font-black text-[var(--primary)]">Back to login</Link></p></form></Container></div>;
}
