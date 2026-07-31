"use client";

import Link from "next/link";
import {
    MapPin,
  ArrowLeft,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Grid2X2,
  PackageCheck,
  Settings,
  ShoppingBag,
  Store,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { getActiveCategories } from "@/data/categories";
import { getActiveProducts } from "@/data/products";
import { getStoredOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { BootkitOrder } from "@/types/order";

const adminModules = [
    {
  title: "Delivery areas",
  description: "Manage wards, pincodes, fees and delivery time",
  href: "/admin/delivery-areas",
  icon: MapPin,
},
  {

    title: "Orders",
    description: "Manage order status, payment and delivery",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Products",
    description: "Manage local product inventory",
    href: "/admin/products",
    icon: Boxes,
  },
  {
    title: "Categories",
    description: "Manage departments and product groups",
    href: "/admin/categories",
    icon: Grid2X2,
  },
  {
    title: "Brands",
    description: "Manage product brands and visibility",
    href: "/admin/brands",
    icon: Store,
  },
  {
    title: "Inventory",
    description: "Monitor stock and low-stock alerts",
    href: "/admin/inventory",
    icon: Boxes,
  },
  {
    title: "Customers",
    description: "View local customer profiles and activity",
    href: "/admin/customers",
    icon: UsersRound,
  },
  {
    title: "Store settings",
    description: "Delivery, payment and app preferences",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminDashboardClient() {
  const [orders, setOrders] = useState<BootkitOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOrders(getStoredOrders());
    setHydrated(true);
  }, []);

  const products = getActiveProducts();
  const categories = getActiveCategories();

  const stats = useMemo(() => {
    const activeOrders = orders.filter(
      (order) =>
        order.status !== "Delivered" &&
        order.status !== "Cancelled"
    );

    const deliveredOrders = orders.filter(
      (order) => order.status === "Delivered"
    );

    const revenue = orders
      .filter((order) => order.status !== "Cancelled")
      .reduce((total, order) => total + order.totalAmount, 0);

    return {
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      deliveredOrders: deliveredOrders.length,
      revenue,
    };
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--primary)]">
                BootKiT local admin
              </p>

              <h1 className="text-[25px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[32px]">
                Admin dashboard
              </h1>

              <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                Manage your local store and customer orders
              </p>
            </div>
          </div>

          {!hydrated ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-[22px] bg-white"
                />
              ))}
            </div>
          ) : (
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <DashboardStat
                icon={ShoppingBag}
                label="Total orders"
                value={stats.totalOrders.toString()}
              />

              <DashboardStat
                icon={Clock3}
                label="Active orders"
                value={stats.activeOrders.toString()}
              />

              <DashboardStat
                icon={PackageCheck}
                label="Delivered"
                value={stats.deliveredOrders.toString()}
              />

              <DashboardStat
                icon={CircleDollarSign}
                label="Revenue"
                value={formatPrice(stats.revenue)}
              />
            </section>
          )}

          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-black tracking-[-0.035em] text-[var(--text-primary)]">
                Store management
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Open a module to manage BootKiT
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {adminModules.map((module) => {
                const Icon = module.icon;

                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group flex items-center gap-4 rounded-[22px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-md)]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary-light)] text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                      <Icon size={22} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-[var(--text-primary)]">
                        {module.title}
                      </span>

                      <span className="mt-1 block text-[10px] leading-4 text-[var(--text-muted)]">
                        {module.description}
                      </span>
                    </span>

                    <ChevronRight
                      size={18}
                      className="shrink-0 text-[var(--text-muted)]"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[var(--text-primary)]">
                    Recent orders
                  </h2>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Latest customer orders on this device
                  </p>
                </div>

                <Link
                  href="/admin/orders"
                  className="text-xs font-black text-[var(--primary)]"
                >
                  View all
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="mt-5 divide-y divide-[var(--border)]">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.orderNumber}`}
                      className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary)]">
                        <ShoppingBag size={18} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-black text-[var(--text-primary)]">
                          {order.orderNumber}
                        </span>

                        <span className="mt-1 block truncate text-[10px] text-[var(--text-muted)]">
                          {order.address.fullName} · {order.status}
                        </span>
                      </span>

                      <span className="shrink-0 text-xs font-black text-[var(--text-primary)]">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-center">
                  <ShoppingBag
                    size={30}
                    className="text-[var(--text-muted)]"
                  />

                  <p className="mt-3 text-sm font-black text-[var(--text-primary)]">
                    No orders yet
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Customer orders will appear here
                  </p>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <section className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--primary-light)] text-[var(--primary)]">
                    <Store size={20} />
                  </span>

                  <div>
                    <h2 className="text-sm font-black text-[var(--text-primary)]">
                      Local inventory
                    </h2>

                    <p className="text-[10px] text-[var(--text-muted)]">
                      Current BootKiT catalogue
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <InventoryRow
                    label="Products"
                    value={products.length.toString()}
                  />

                  <InventoryRow
                    label="Categories"
                    value={categories.length.toString()}
                  />

                  <InventoryRow
                    label="Service pincode"
                    value="331403"
                  />

                  <InventoryRow
                    label="Storage"
                    value="Local device"
                  />
                </div>
              </section>

              <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-900">
                  Local admin mode
                </p>

                <p className="mt-1 text-[10px] leading-5 text-amber-800">
                  Admin access is not protected yet. Secure admin login will be
                  added when you decide to connect authentication.
                </p>
              </section>
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}

function DashboardStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[22px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
        <Icon size={19} />
      </span>

      <p className="mt-4 text-xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold text-[var(--text-muted)]">
        {label}
      </p>
    </article>
  );
}

function InventoryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-[var(--text-muted)]">{label}</span>

      <span className="font-black text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}
