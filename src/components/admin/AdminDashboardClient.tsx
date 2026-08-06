"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  ChevronRight,
  Clock3,
  Grid2X2,
  Image,
  MapPin,
  PackageCheck,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { getActiveCategories } from "@/data/categories";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { getStoredOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { BootkitOrder } from "@/types/order";

const managementLinks = [
  { title: "Orders", href: "/admin/orders", icon: ShoppingBag, tone: "bg-amber-100 text-amber-700" },
  { title: "Products", href: "/admin/products", icon: Boxes, tone: "bg-sky-100 text-sky-700" },
  { title: "Categories", href: "/admin/categories", icon: Grid2X2, tone: "bg-violet-100 text-violet-700" },
  { title: "Delivery areas", href: "/admin/delivery-areas", icon: MapPin, tone: "bg-rose-100 text-rose-700" },
  { title: "Media library", href: "/admin/media", icon: Image, tone: "bg-emerald-100 text-emerald-700" },
  { title: "Brand management", href: "/admin/brands", icon: Tag, tone: "bg-orange-100 text-orange-700" },
];

export default function AdminDashboardClient() {
  const [orders, setOrders] = useState<BootkitOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOrders(getStoredOrders());
    setHydrated(true);
  }, []);

  const { activeProducts: products } = useAdminProducts();
  const categories = getActiveCategories();
  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "Delivered" && order.status !== "Cancelled");
    const deliveredOrders = orders.filter((order) => order.status === "Delivered");
    const revenue = orders.filter((order) => order.status !== "Cancelled").reduce((total, order) => total + order.totalAmount, 0);

    return { totalOrders: orders.length, activeOrders: activeOrders.length, deliveredOrders: deliveredOrders.length, revenue };
  }, [orders]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Back to home" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">
                <ArrowLeft size={19} />
              </Link>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">BootKiT · local admin</p>
                <h1 className="mt-0.5 text-[28px] font-black tracking-[-0.05em] text-[var(--text-primary)] sm:text-[36px]">Good morning, admin.</h1>
              </div>
            </div>
            <Link href="/admin/products/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-black text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]">
              <Plus size={18} /> Add product
            </Link>
          </div>

          {!hydrated ? <DashboardSkeleton /> : (
            <div className="grid gap-3 lg:grid-cols-12 lg:grid-rows-[minmax(190px,auto)_minmax(220px,auto)_minmax(230px,auto)]">
              <section className="relative overflow-hidden rounded-[28px] bg-[var(--primary)] p-6 text-white shadow-[var(--shadow-md)] lg:col-span-5 lg:row-span-2 sm:p-7">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 right-8 h-48 w-48 rounded-full border-[28px] border-white/10" />
                <div className="relative flex h-full flex-col">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-amber-200"><Sparkles size={21} /></span>
                  <p className="mt-7 text-sm font-bold text-white/65">Store revenue</p>
                  <p className="mt-1 text-4xl font-black tracking-[-0.06em] sm:text-5xl">{formatPrice(stats.revenue)}</p>
                  <div className="mt-auto flex items-end justify-between pt-8">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold text-white/85"><TrendingUp size={14} /> All-time earnings</span>
                    <Link href="/admin/reports" aria-label="View sales reports" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--primary)] transition hover:scale-105"><ArrowUpRight size={19} /></Link>
                  </div>
                </div>
              </section>

              <StatTile className="lg:col-span-3" href="/admin/orders" icon={ShoppingBag} label="Total orders" value={String(stats.totalOrders)} detail="Orders received" />
              <StatTile className="lg:col-span-2" href="/admin/orders" icon={Clock3} label="In progress" value={String(stats.activeOrders)} detail="Need attention" accent />
              <StatTile className="lg:col-span-2" href="/admin/orders" icon={PackageCheck} label="Delivered" value={String(stats.deliveredOrders)} detail="Successfully fulfilled" />

              <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] lg:col-span-7 lg:row-span-2 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--primary)]">Live activity</p><h2 className="mt-1 text-xl font-black tracking-[-0.04em]">Recent orders</h2></div>
                  <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-black text-[var(--primary)]">View all <ChevronRight size={15} /></Link>
                </div>
                {orders.slice(0, 4).length ? <div className="mt-4 divide-y divide-[var(--border)]">{orders.slice(0, 4).map((order) => <Link key={order.id} href={`/orders/${order.orderNumber}`} className="group flex items-center gap-3 py-3.5 first:pt-1 transition hover:px-1">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary)]"><ShoppingBag size={17} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-black">{order.orderNumber}</span><span className="mt-1 block truncate text-[10px] text-[var(--text-muted)]">{order.address.fullName} · {order.status}</span></span>
                  <span className="text-xs font-black">{formatPrice(order.totalAmount)}</span><ChevronRight size={16} className="text-[var(--text-muted)] transition group-hover:text-[var(--primary)]" />
                </Link>)}</div> : <div className="mt-5 flex min-h-40 flex-col items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-center"><ShoppingBag size={25} className="text-[var(--text-muted)]" /><p className="mt-2 text-sm font-black">No orders yet</p><p className="mt-1 text-xs text-[var(--text-muted)]">New customer orders will appear here.</p></div>}
              </section>

              <section className="rounded-[28px] bg-[var(--surface-muted)] p-5 lg:col-span-5 sm:p-6">
                <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">Catalogue</p><h2 className="mt-1 text-lg font-black tracking-[-0.04em]">Your inventory</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-[var(--shadow-xs)]"><Store size={18} /></span></div>
                <div className="mt-5 grid grid-cols-2 gap-3"><InventoryCount href="/admin/products" label="Active products" value={String(products.length)} /><InventoryCount href="/admin/categories" label="Categories" value={String(categories.length)} /></div>
                <Link href="/admin/inventory" className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-xs font-black transition hover:text-[var(--primary)]">Open inventory <ArrowUpRight size={16} /></Link>
              </section>

              <section className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] lg:col-span-12 sm:p-6">
                <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--primary)]">Quick access</p><h2 className="mt-1 text-lg font-black tracking-[-0.04em]">Manage your store</h2></div><Link href="/admin/brands" className="hidden items-center gap-1 text-xs font-black text-[var(--primary)] sm:inline-flex">Manage brands <ChevronRight size={15} /></Link></div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{managementLinks.map(({ title, href, icon: Icon, tone }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-3.5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span><span className="min-w-0 text-xs font-black leading-4">{title}</span></Link>)}</div>
              </section>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, detail, accent, className, href }: { icon: typeof ShoppingBag; label: string; value: string; detail: string; accent?: boolean; className?: string; href: string }) {
  return <Link href={href} className={`rounded-[28px] border p-5 shadow-[var(--shadow-sm)] ${accent ? "border-amber-200 bg-amber-50" : "border-[var(--border)] bg-white"} ${className ?? ""}`}><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent ? "bg-amber-200 text-amber-800" : "bg-[var(--primary-light)] text-[var(--primary)]"}`}><Icon size={18} /></span><p className="mt-5 text-3xl font-black tracking-[-0.055em]">{value}</p><p className="mt-1 text-xs font-black">{label}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p></Link>;
}

function InventoryCount({ label, value, href }: { label: string; value: string; href: string }) {
  return <Link href={href} className="rounded-2xl bg-white p-4"><p className="text-2xl font-black tracking-[-0.04em]">{value}</p><p className="mt-1 text-[10px] font-bold text-[var(--text-muted)]">{label}</p></Link>;
}

function DashboardSkeleton() {
  return <div className="grid gap-3 lg:grid-cols-12"><div className="h-72 animate-pulse rounded-[28px] bg-[var(--surface-muted)] lg:col-span-5" />{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-[28px] bg-white lg:col-span-2" />)}</div>;
}
