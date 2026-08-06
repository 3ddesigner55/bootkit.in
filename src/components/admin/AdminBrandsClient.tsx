"use client";

import { Pencil, Plus, RefreshCw, Save, Tag, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import type { Brand } from "@/types/brand";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminLoadingSkeleton from "@/components/admin/ui/AdminLoadingSkeleton";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminPrimaryButton from "@/components/admin/ui/AdminPrimaryButton";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";

type Form = { name: string; slug: string; logo: string; description: string; active: boolean };
const empty: Form = { name: "", slug: "", logo: "🏷️", description: "", active: true };
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function AdminBrandsClient() {
  const { brands, hydrated, addBrand, updateBrand, removeBrand, toggleBrand, resetBrands } = useAdminBrands();
  const { products } = useAdminProducts();
  const [form, setForm] = useState<Form | null>(null);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [error, setError] = useState("");
  const start = (brand?: Brand) => { setEditing(brand ?? null); setForm(brand ? { name: brand.name, slug: brand.slug, logo: brand.logo, description: brand.description, active: brand.active } : empty); setError(""); };
  const save = (event: FormEvent) => { event.preventDefault(); if (!form) return; if (form.name.trim().length < 2) return setError("Brand name कम से कम 2 अक्षर का होना चाहिए।"); if (form.description.trim().length < 5) return setError("Brand description कम से कम 5 अक्षर का होना चाहिए।"); const data = { ...form, name: form.name.trim(), slug: form.slug || slugify(form.name), logo: form.logo.trim() || "🏷️", description: form.description.trim() }; if (editing) updateBrand(editing.id, data); else addBrand(data); setForm(null); setEditing(null); };
  if (!hydrated) return <div className="min-h-screen bg-[var(--background)]"><Header /><Container className="py-8"><AdminLoadingSkeleton variant="page" /></Container></div>;
  return <div className="min-h-screen bg-[var(--background)]"><Header /><main><Container className="py-5 sm:py-8"><AdminPageHeader title="Brand management" description="Brands और product association manage करें" action={<AdminPrimaryButton icon={<Plus size={15} />} onClick={() => start()}>Add brand</AdminPrimaryButton>} />
  {form && <form onSubmit={save} className="mb-5 rounded-3xl border border-[var(--primary)] bg-white p-5 shadow-[var(--shadow-sm)]"><div className="mb-4 flex justify-between"><h2 className="text-lg font-black">{editing ? "Edit brand" : "Add brand"}</h2><button type="button" onClick={() => setForm(null)}><X size={18} /></button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{([['name','Brand name','BootKiT Fresh'],['slug','Slug','bootkit-fresh'],['logo','Logo / icon','🏷️'],['description','Description','Fresh everyday essentials']] as const).map(([field,label,placeholder]) => <label key={field} className="block"><span className="mb-1 block text-xs font-bold">{label}</span><input value={form[field]} placeholder={placeholder} onChange={(event) => setForm((current) => current ? { ...current, [field]: field === 'slug' ? slugify(event.target.value) : event.target.value } : current)} className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm" /></label>)}</div><label className="mt-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => current ? { ...current, active: event.target.checked } : current)} />Active brand</label>{error && <p className="mt-3 text-xs font-bold text-[var(--danger)]">{error}</p>}<AdminPrimaryButton type="submit" icon={<Save size={16} />} className="mt-4 h-11 text-sm">Save brand</AdminPrimaryButton></form>}
  <div className="mb-4 flex justify-end"><button onClick={() => { if (window.confirm("Reset all local brands?")) resetBrands(); }} className="flex items-center gap-2 text-xs font-bold text-[var(--danger)]"><RefreshCw size={14} />Reset brands</button></div>{brands.length === 0 ? <AdminEmptyState title="No brands yet" description="Add a brand to organize product associations." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{brands.map((brand) => { const count = products.filter((product) => product.brand === brand.name).length; return <article key={brand.id} className="rounded-2xl border border-[var(--border)] bg-white p-4"><div className="flex items-start justify-between"><span className="text-3xl">{brand.logo}</span><AdminStatusBadge label={brand.active ? "Active" : "Inactive"} tone={brand.active ? "success" : "neutral"} /></div><h2 className="mt-3 font-black text-[var(--text-primary)]">{brand.name}</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{brand.description}</p><p className="mt-3 flex items-center gap-1 text-xs font-bold text-[var(--primary)]"><Tag size={13} />{count} products</p><div className="mt-4 flex gap-2"><button onClick={() => start(brand)} className="rounded-lg border border-[var(--border)] p-2"><Pencil size={15} /></button><button onClick={() => toggleBrand(brand.id)} className="rounded-lg border border-[var(--border)] px-3 text-xs font-bold">{brand.active ? "Disable" : "Enable"}</button><button onClick={() => { if (!count && window.confirm(`Delete ${brand.name}?`)) removeBrand(brand.id); }} disabled={count > 0} className="rounded-lg border border-red-100 p-2 text-[var(--danger)] disabled:opacity-30"><Trash2 size={15} /></button></div></article>; })}</div>}</Container></main></div>;
}
