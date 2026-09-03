"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { useAccount } from "@/hooks/useAccount";

export default function RegisterPage() {
  const { register } = useAccount(); const router = useRouter(); const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" }); const [error, setError] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); const result = await register({ fullName: form.fullName, email: form.email, phone: form.phone, dateOfBirth: "" }, form.password); if (!result.success) return setError(result.message); router.push("/account"); };
  return <div className="min-h-screen bg-[var(--background)]"><Header /><Container className="py-10"><form onSubmit={submit} className="mx-auto max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]"><h1 className="text-2xl font-black">Create account</h1><p className="mt-1 text-sm text-[var(--text-muted)]">Customer account सुरक्षित रूप से local mode में बनाएँ</p>{([['fullName','Full name','text'],['email','Email','email'],['phone','Mobile number','tel'],['password','Password (minimum 8 characters)','password']] as const).map(([field,label,type]) => <label key={field} className="mt-4 block text-xs font-bold">{label}<input type={type} required minLength={field === 'password' ? 8 : undefined} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm" /></label>)}{error && <p className="mt-3 text-xs font-bold text-[var(--danger)]">{error}</p>}<button className="mt-6 h-12 w-full rounded-xl bg-[var(--primary)] text-sm font-black text-white">Create account</button><p className="mt-4 text-center text-xs">पहले से account है? <Link href="/login" className="font-black text-[var(--primary)]">Login</Link></p></form></Container></div>;
}
