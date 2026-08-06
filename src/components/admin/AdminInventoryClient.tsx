"use client";

import { AlertTriangle, Boxes, PackageCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { formatPrice } from "@/lib/utils";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminLoadingSkeleton from "@/components/admin/ui/AdminLoadingSkeleton";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminPrimaryButton from "@/components/admin/ui/AdminPrimaryButton";

const LOW_STOCK_LIMIT = 10;

export default function AdminInventoryClient() {
  const { products, hydrated, updateProduct } = useAdminProducts();
  const [stockChanges, setStockChanges] = useState<Record<string, string>>({});
  const lowStock = useMemo(() => products.filter((product) => product.stock <= LOW_STOCK_LIMIT).sort((a, b) => a.stock - b.stock), [products]);
  const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.price, 0);
  const saveStock = (id: string) => { const stock = Number(stockChanges[id]); if (!Number.isInteger(stock) || stock < 0) return; updateProduct(id, { stock }); setStockChanges((current) => ({ ...current, [id]: "" })); };
  if (!hydrated) return <div className="min-h-screen bg-[var(--background)]"><Header /><Container className="py-8"><AdminLoadingSkeleton variant="page" /></Container></div>;
  return <div className="min-h-screen bg-[var(--background)]"><Header /><main><Container className="py-5 sm:py-8"><AdminPageHeader title="Inventory & low stock" description="Stock levels को देखिए और तुरंत update कीजिए" /><section className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Stat icon={<Boxes size={20} />} label="Inventory value" value={formatPrice(inventoryValue)} /><Stat icon={<AlertTriangle size={20} />} label="Low stock items" value={String(lowStock.length)} /><Stat icon={<PackageCheck size={20} />} label="Total products" value={String(products.length)} /></section><section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]"><div className="border-b border-[var(--border)] px-5 py-4"><h2 className="font-black">Low-stock alerts</h2><p className="mt-1 text-xs text-[var(--text-muted)]">10 units या कम stock वाले products</p></div>{lowStock.length ? <div className="divide-y divide-[var(--border)]">{lowStock.map((product) => <div key={product.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-2xl">{product.fallbackIcon}</span><div className="min-w-0 flex-1"><p className="font-black">{product.name}</p><p className="text-xs text-[var(--text-muted)]">{product.unit.label} · {product.stock} units left</p></div><div className="flex items-center gap-2"><input value={stockChanges[product.id] ?? ""} onChange={(event) => setStockChanges((current) => ({ ...current, [product.id]: event.target.value.replace(/\D/g, "") }))} placeholder="New stock" inputMode="numeric" className="h-10 w-24 rounded-lg border border-[var(--border)] px-3 text-xs" /><AdminPrimaryButton type="button" onClick={() => saveStock(product.id)} className="rounded-lg px-3">Update</AdminPrimaryButton></div></div>)}</div> : <AdminEmptyState title="All products have healthy stock." description="No products currently need a stock update." className="min-h-[220px] border-0" />}</section></Container></main></div>;
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-[var(--border)] bg-white p-4"><span className="text-[var(--primary)]">{icon}</span><p className="mt-3 text-xl font-black">{value}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p></div>; }
