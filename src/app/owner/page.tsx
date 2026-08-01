"use client";

import Link from "next/link";
import { ArrowLeft, Crown, ShieldCheck, ShoppingBag, UsersRound } from "lucide-react";
import { useState } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { useAccount } from "@/hooks/useAccount";
import type { UserRole } from "@/types/account";
import { products } from "@/data/products";
import { supabase } from "@/lib/supabase/client";

export default function OwnerPage() {
  const { users, updateUserRole } = useAccount();
  const [seedMessage, setSeedMessage] = useState("");
  const admins = users.filter((user) => user.role === "ADMIN").length;
  const customers = users.filter((user) => user.role === "CUSTOMER").length;
  const seedProducts = async () => {
    if (!supabase) return setSeedMessage("Supabase connection missing है।");
    const { error } = await supabase.from("products").upsert(products.map((product) => ({ name: product.name, slug: product.slug, brand: product.brand, category_slug: product.categorySlug, image_url: product.image || null, fallback_icon: product.fallbackIcon, unit_label: product.unit.label, unit_value: product.unit.value, mrp: product.mrp, price: product.price, stock: product.stock, rating: product.rating, review_count: product.reviewCount, delivery_minutes: product.deliveryMinutes, featured: product.featured, bestseller: product.bestseller, active: product.active })), { onConflict: "slug" });
    setSeedMessage(error ? error.message : `${products.length} products database में sync हो गए।`);
  };

  return <div className="min-h-screen bg-[var(--background)]"><Header /><main><Container className="py-5 sm:py-8">
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="flex items-center gap-3"><Link href="/account" aria-label="Back to account" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white"><ArrowLeft size={19} /></Link><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[var(--primary)]">BootKiT owner</p><h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Store control centre</h1></div></div><Link href="/admin" className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-white">Open admin dashboard</Link></div>
    <section className="grid gap-3 sm:grid-cols-3"><Overview icon={<Crown size={20} />} label="Owner" value="You" tone="bg-amber-100 text-amber-800" /><Overview icon={<ShieldCheck size={20} />} label="Admins" value={String(admins)} tone="bg-sky-100 text-sky-700" /><Overview icon={<UsersRound size={20} />} label="Customers" value={String(customers)} tone="bg-violet-100 text-violet-700" /></section>
    <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"><div className="flex flex-col justify-between gap-2 border-b border-[var(--border)] px-5 py-5 sm:flex-row sm:items-center"><div><h2 className="font-black">People & permissions</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Admins can manage the store. Customers can shop and track their own orders.</p></div><span className="text-xs font-black text-[var(--primary)]">{users.length} registered users</span></div>{users.length ? <div className="divide-y divide-[var(--border)]">{users.map((user) => <div key={user.profile.email} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] font-black text-[var(--primary)]">{user.profile.fullName.slice(0, 1).toUpperCase() || "U"}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{user.profile.fullName || "Unnamed user"}</p><p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{user.profile.email}</p></div>{user.role === "OWNER" ? <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-black text-amber-900">OWNER</span> : <select aria-label={`Change role for ${user.profile.fullName || user.profile.email}`} value={user.role} onChange={(event) => updateUserRole(user.profile.email, event.target.value as UserRole)} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-black"><option value="CUSTOMER">Customer</option><option value="ADMIN">Admin</option></select>}</div>)}</div> : <div className="p-12 text-center"><UsersRound className="mx-auto text-[var(--text-muted)]" size={28} /><p className="mt-3 text-sm font-black">No registered users yet</p><p className="mt-1 text-xs text-[var(--text-muted)]">New customer accounts will appear here.</p></div>}</section>
    <section className="mt-5 grid gap-3 sm:grid-cols-2"><Link href="/admin/orders" className="rounded-3xl bg-[var(--primary)] p-5 text-white"><ShoppingBag size={20} /><h2 className="mt-5 text-lg font-black">Order control</h2><p className="mt-1 text-xs text-white/70">View and manage all store orders.</p></Link><Link href="/admin/reports" className="rounded-3xl bg-[var(--surface-muted)] p-5"><ShieldCheck size={20} className="text-[var(--primary)]" /><h2 className="mt-5 text-lg font-black">Sales reports</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Review revenue and order performance.</p></Link></section>
    <section className="mt-5 flex flex-col justify-between gap-3 rounded-3xl border border-[var(--border)] bg-white p-5 sm:flex-row sm:items-center"><div><h2 className="font-black">Product database</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Current catalogue को Supabase में पहली बार import करें।</p>{seedMessage && <p className="mt-2 text-xs font-bold text-[var(--primary)]">{seedMessage}</p>}</div><button type="button" onClick={seedProducts} className="h-10 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-white">Sync {products.length} products</button></section>
  </Container></main></div>;
}

function Overview({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return <article className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-xs)]"><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>{icon}</span><p className="mt-5 text-2xl font-black tracking-[-.04em]">{value}</p><p className="mt-1 text-xs font-bold text-[var(--text-muted)]">{label}</p></article>;
}
