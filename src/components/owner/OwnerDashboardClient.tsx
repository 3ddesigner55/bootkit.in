"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  Crown,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { getApiBaseUrl } from "@/services/api";

type PlatformStats = {
  totalProducts: number;
  totalCategories: number;
  totalStores: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  publishedHomeVersion: number | null;
  lastPublishedAt: string | null;
};

type RecentOrder = {
  _id: string;
  orderNumber: string;
  customerName?: string;
  grandTotal: number;
  status: string;
  createdAt: string;
};

type ActiveStore = {
  _id: string;
  name: string;
  city: string;
  active: boolean;
};

export default function OwnerDashboardClient() {
  const { session, logout } = useAccount();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlatformStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalStores: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    publishedHomeVersion: null,
    lastPublishedAt: null,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activeStores, setActiveStores] = useState<ActiveStore[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = session?.accessToken;
      const apiBase = getApiBaseUrl();

      // Fetch dashboard summary
      const dashRes = await fetch(`${apiBase}/admin/dashboard/summary`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const dashData = dashRes.ok ? await dashRes.json() : null;

      // Fetch home config status
      const homeRes = await fetch(`${apiBase}/admin/home-config/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const homeData = homeRes.ok ? await homeRes.json() : null;

      // Fetch stores list
      const storeRes = await fetch(`${apiBase}/admin/stores`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const storeData = storeRes.ok ? await storeRes.json() : null;

      // Fetch recent orders
      const orderRes = await fetch(`${apiBase}/admin/orders?limit=5`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const orderData = orderRes.ok ? await orderRes.json() : null;

      const latestPublished = homeData?.data?.versions?.find(
        (v: any) => v.status === "PUBLISHED"
      );

      setStats({
        totalProducts: dashData?.data?.productsCount ?? 0,
        totalCategories: dashData?.data?.categoriesCount ?? 0,
        totalStores: dashData?.data?.storesCount ?? (storeData?.data?.length ?? 0),
        totalOrders: dashData?.data?.ordersCount ?? 0,
        totalCustomers: dashData?.data?.customersCount ?? 0,
        totalRevenue: dashData?.data?.totalRevenue ?? 0,
        publishedHomeVersion: latestPublished?.configVersion ?? null,
        lastPublishedAt: latestPublished?.publishedAt ?? null,
      });

      if (orderData?.data?.orders) {
        setRecentOrders(orderData.data.orders);
      }
      if (Array.isArray(storeData?.data)) {
        setActiveStores(storeData.data.slice(0, 5));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load owner control centre metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [session?.accessToken]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1A1A1A]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/90 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white hover:bg-gray-50 transition"
              title="Back to Admin"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 items-center gap-1 rounded-full bg-amber-100 px-2 text-[10px] font-black uppercase tracking-wider text-amber-900">
                  <Crown size={12} /> Owner Centre
                </span>
                <span className="text-xs text-[var(--text-muted)]">|</span>
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  {session?.email || "Platform Owner"}
                </span>

              </div>
              <h1 className="text-lg font-black tracking-tight">Executive Control Centre</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/admin/home-builder"
              className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
            >
              <Sparkles size={14} />
              <span>Home Builder</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="py-6 sm:py-8">
        <Container className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
              ⚠️ {error}
            </div>
          )}

          {/* Quick Metrics Grid */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              label="Stores"
              value={loading ? "..." : String(stats.totalStores)}
              icon={<Store size={18} className="text-emerald-700" />}
              tone="bg-emerald-50"
            />
            <MetricCard
              label="Products"
              value={loading ? "..." : String(stats.totalProducts)}
              icon={<Boxes size={18} className="text-blue-700" />}
              tone="bg-blue-50"
            />
            <MetricCard
              label="Categories"
              value={loading ? "..." : String(stats.totalCategories)}
              icon={<Grid2X2 size={18} className="text-indigo-700" />}
              tone="bg-indigo-50"
            />
            <MetricCard
              label="Orders"
              value={loading ? "..." : String(stats.totalOrders)}
              icon={<ShoppingBag size={18} className="text-amber-700" />}
              tone="bg-amber-50"
            />
            <MetricCard
              label="Customers"
              value={loading ? "..." : String(stats.totalCustomers)}
              icon={<Users size={18} className="text-violet-700" />}
              tone="bg-violet-50"
            />
            <MetricCard
              label="Total Revenue"
              value={loading ? "..." : `₹${stats.totalRevenue.toLocaleString("en-IN")}`}
              icon={<BarChart3 size={18} className="text-teal-700" />}
              tone="bg-teal-50"
            />
          </section>

          {/* Home Merchandising Status Banner */}
          <section className="rounded-3xl border border-[var(--border)] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-base font-black">Home Merchandising Engine</h2>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Live Version:{" "}
                  <strong className="text-[var(--foreground)]">
                    {stats.publishedHomeVersion ? `v${stats.publishedHomeVersion}` : "Default Fallback"}
                  </strong>{" "}
                  {stats.lastPublishedAt && (
                    <span>• Last published {new Date(stats.lastPublishedAt).toLocaleString("en-IN")}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/home-builder"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-white hover:opacity-90 transition"
                >
                  Configure Home Sections
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-black hover:bg-gray-50 transition"
                >
                  Live Store View
                </Link>
              </div>
            </div>
          </section>

          {/* Two-Column Management Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Active Stores */}
            <section className="rounded-3xl border border-[var(--border)] bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm">Active Stores</h3>
                  <p className="text-xs text-[var(--text-muted)]">Fulfillment locations and service areas</p>
                </div>
                <Link
                  href="/admin/stores"
                  className="text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  Manage All →
                </Link>
              </div>

              {activeStores.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No active stores found.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {activeStores.map((store) => (
                    <div key={store._id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-xs font-black">{store.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{store.city}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                        ACTIVE
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Orders */}
            <section className="rounded-3xl border border-[var(--border)] bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm">Recent Store Orders</h3>
                  <p className="text-xs text-[var(--text-muted)]">Latest customer transactions</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  View Orders →
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No orders recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-xs font-black">{order.orderNumber}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black">₹{order.grandTotal}</p>
                        <span className="text-[10px] font-bold uppercase text-[var(--primary)]">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Platform Management Navigation Tiles */}
          <section className="rounded-3xl border border-[var(--border)] bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="mb-4 font-black text-sm">Platform Management Modules</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Link
                href="/admin/products"
                className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:bg-emerald-50/40 transition"
              >
                <Boxes size={20} className="text-emerald-700" />
                <div>
                  <p className="text-xs font-black">Products</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Catalogue master & pricing</p>
                </div>
              </Link>
              <Link
                href="/admin/categories"
                className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:bg-emerald-50/40 transition"
              >
                <Grid2X2 size={20} className="text-emerald-700" />
                <div>
                  <p className="text-xs font-black">Categories</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Taxonomy hierarchy</p>
                </div>
              </Link>
              <Link
                href="/admin/reports"
                className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:bg-emerald-50/40 transition"
              >
                <BarChart3 size={20} className="text-emerald-700" />
                <div>
                  <p className="text-xs font-black">Reports</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Sales & store performance</p>
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:bg-emerald-50/40 transition"
              >
                <Users size={20} className="text-emerald-700" />
                <div>
                  <p className="text-xs font-black">User Access</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Staff & roles</p>
                </div>
              </Link>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xs">
      <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}>
        {icon}
      </span>
      <p className="mt-3 text-lg font-black tracking-tight">{value}</p>
      <p className="text-[11px] font-bold text-[var(--text-muted)]">{label}</p>
    </article>
  );
}
