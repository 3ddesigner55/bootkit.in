"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { useAccount } from "@/hooks/useAccount";

export default function LoginPage() {
  const { login } = useAccount(); const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); const result = await login(email, password); if (!result.success) return setError(result.message); router.push("/account"); };
  return <div className="min-h-screen bg-[var(--background)]"><Header /><Container className="py-10"><form onSubmit={submit} className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]"><h1 className="text-2xl font-black">Login</h1><p className="mt-1 text-sm text-[var(--text-muted)]">अपने BootKiT account में sign in करें</p><label className="mt-6 block text-xs font-bold">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm" /></label><label className="mt-4 block text-xs font-bold">Password<input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm" /></label>{error && <p className="mt-3 text-xs font-bold text-[var(--danger)]">{error}</p>}<button className="mt-6 h-12 w-full rounded-xl bg-[var(--primary)] text-sm font-black text-white">Login</button><p className="mt-4 text-center text-xs">नया account? <Link href="/register" className="font-black text-[var(--primary)]">Register</Link></p></form></Container></div>;
}
