"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { formatPrice } from "@/lib/utils";
import { getStoredOrders } from "@/lib/orders";
import type { BootkitOrder } from "@/types/order";

export default function OrdersPage() {
  const [orders, setOrders] = useState<BootkitOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOrders(getStoredOrders());
    setHydrated(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-5 sm:py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <h1 className="text-[25px] font-black tracking-[-0.04em] text-[var(--text-primary)] sm:text-[32px]">
                My orders
              </h1>

              <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                Track and review your BootKiT orders
              </p>
            </div>
          </div>

          {!hydrated ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-[24px] border border-[var(--border)] bg-white"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <section className="flex min-h-[460px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-white px-5 text-center shadow-[var(--shadow-sm)]">
              <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--primary-light)] text-[var(--primary)]">
                <ShoppingBag size={36} />
              </span>

              <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
                No orders yet
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                Your placed orders will appear here with payment and delivery
                status.
              </p>

              <Link
                href="/"
                className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-6 text-sm font-bold text-white"
              >
                Start shopping
              </Link>
            </section>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

function OrderCard({ order }: { order: BootkitOrder }) {
  const createdAt = new Date(order.createdAt);

  const totalQuantity = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Order number
          </p>

          <p className="mt-1 text-base font-black text-[var(--text-primary)]">
            {order.orderNumber}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />

          <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
            {order.paymentMethod}
          </span>

          <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-2">
              <CalendarDays
                size={15}
                className="text-[var(--primary)]"
              />
              {createdAt.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>

            <span className="flex items-center gap-2">
              <Clock3 size={15} className="text-[var(--primary)]" />
              {createdAt.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            <span className="flex items-center gap-2">
              <Package size={15} className="text-[var(--primary)]" />
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-[var(--text-secondary)]">
            <MapPin
              size={16}
              className="mt-0.5 shrink-0 text-[var(--primary)]"
            />

            <span>
              {order.address.houseNumber}, {order.address.street},{" "}
              {order.address.area}
              {order.address.landmark
                ? `, ${order.address.landmark}`
                : ""}
              , {order.address.city}, {order.address.state} -{" "}
              {order.address.pincode}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {order.items.slice(0, 3).map((item) => (
              <span
                key={item.product.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-secondary)]"
              >
                {item.product.name} × {item.quantity}
              </span>
            ))}

            {order.items.length > 3 && (
              <span className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">
                +{order.items.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-[var(--border)] pt-4 lg:min-w-[190px] lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="lg:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Order total
            </p>

            <p className="mt-1 text-xl font-black tracking-[-0.03em] text-[var(--text-primary)]">
              {formatPrice(order.totalAmount)}
            </p>

            {order.savings > 0 && (
              <p className="mt-1 text-[10px] font-bold text-[var(--success)]">
                Saved {formatPrice(order.savings)}
              </p>
            )}
          </div>

          <Link
            href={`/orders/${order.orderNumber}`}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-white transition hover:bg-[var(--primary-hover)]"
          >
            View details
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: BootkitOrder["status"];
}) {
  const styles: Record<BootkitOrder["status"], string> = {
    Placed: "bg-blue-50 text-blue-700",
    Confirmed: "bg-indigo-50 text-indigo-700",
    Packing: "bg-amber-50 text-amber-700",
    "Out for Delivery": "bg-purple-50 text-purple-700",
    Delivered: "bg-green-50 text-green-700",
    Cancelled: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[10px] font-black ${styles[status]}`}
    >
      {status}
    </span>
  );
}