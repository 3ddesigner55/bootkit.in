"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { formatPrice } from "@/lib/utils";
import { useAccount } from "@/hooks/useAccount";
import { getAdminOrders, updateAdminOrderStatus } from "@/services/adminOrders.service";
import type { BootkitOrder } from "@/types/order";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminLoadingSkeleton from "@/components/admin/ui/AdminLoadingSkeleton";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminSearchBar from "@/components/admin/ui/AdminSearchBar";
import AdminStatusBadge, { type AdminStatusTone } from "@/components/admin/ui/AdminStatusBadge";

type OrderStatus = BootkitOrder["status"];

const statusOptions: OrderStatus[] = [
  "Placed",
  "Confirmed",
  "Packing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function AdminOrdersClient() {
  const { hydrated: accountHydrated, session } = useAccount();
  const accessToken = session?.accessToken;
  const [orders, setOrders] = useState<BootkitOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | OrderStatus>("All");
  const [updatingOrder, setUpdatingOrder] = useState("");
  const [page] = useState(1);

  const loadOrders = useCallback(async () => {
    if (!accessToken) { setOrders([]); setHydrated(true); return; }
    try { const result = await getAdminOrders(accessToken, { page, search: query, status: statusFilter === "All" ? undefined : statusFilter.replaceAll(" ", "_").toUpperCase() }); setOrders(result.orders); } finally { setHydrated(true); }
  }, [accessToken, page, query, statusFilter]);

  useEffect(() => {
    if (!accountHydrated) return;
    void loadOrders();
  }, [accountHydrated, loadOrders]);

  const filteredOrders = orders;

  const totalRevenue = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce(
      (total, order) => total + order.totalAmount,
      0
    );

  const pendingOrders = orders.filter(
    (order) =>
      order.status !== "Delivered" &&
      order.status !== "Cancelled"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const changeOrderStatus = async (
    orderNumber: string,
    status: OrderStatus
  ) => {
    setUpdatingOrder(orderNumber);

    if (!accessToken) return;
    try { const updatedOrder = await updateAdminOrderStatus(accessToken, orderNumber, status); setOrders((current) => current.map((order) => order.orderNumber === orderNumber ? updatedOrder : order)); } finally { setUpdatingOrder(""); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <AdminPageHeader
            title="Order management"
            description="Manage orders saved on this device"
            backHref="/"
            backLabel="Back to home"
            action={
              <button
                type="button"
                onClick={loadOrders}
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-black text-[var(--primary)]"
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            }
          />

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={ShoppingBag}
              label="Total orders"
              value={orders.length.toString()}
            />

            <StatCard
              icon={Clock3}
              label="Pending"
              value={pendingOrders.toString()}
            />

            <StatCard
              icon={CheckCircle2}
              label="Delivered"
              value={deliveredOrders.toString()}
            />

            <StatCard
              icon={Package}
              label="Revenue"
              value={formatPrice(totalRevenue)}
            />
          </section>

          <section className="mt-5 rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <AdminSearchBar
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Order, name, phone or pincode"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "All"
                      | OrderStatus
                  )
                }
                className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--text-primary)] outline-none"
              >
                <option value="All">
                  All order statuses
                </option>

                {statusOptions.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {!hydrated ? (
            <AdminLoadingSkeleton variant="list" count={4} className="mt-5" />
          ) : filteredOrders.length === 0 ? (
            <AdminEmptyState
              title="No matching orders"
              description="Orders placed from this browser will appear here."
              icon={Package}
              className="mt-5 min-h-[380px]"
            />
          ) : (
            <div className="mt-5 space-y-4">
              {filteredOrders.map((order) => (
                <AdminOrderCard
                  key={order.id}
                  order={order}
                  updating={
                    updatingOrder === order.orderNumber
                  }
                  onStatusChange={(status) =>
                    changeOrderStatus(
                      order.orderNumber,
                      status
                    )
                  }
                />
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}

function AdminOrderCard({
  order,
  updating,
  onStatusChange,
}: {
  order: BootkitOrder;
  updating: boolean;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const totalQuantity = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] px-4 py-4 sm:px-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Order
          </p>

          <p className="mt-1 text-sm font-black text-[var(--text-primary)]">
            {order.orderNumber}
          </p>

          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            {new Date(order.createdAt).toLocaleString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </p>
        </div>

        <AdminStatusBadge
          label={order.status}
          tone={statusTones[order.status]}
          className="px-3 py-1.5"
        />
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Customer
              </p>

              <p className="mt-1 text-sm font-black text-[var(--text-primary)]">
                {order.address.fullName}
              </p>

              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                +91 {order.address.phone}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Payment
              </p>

              <p className="mt-1 text-sm font-black text-[var(--text-primary)]">
                {order.paymentMethod}
              </p>

              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {order.paymentStatus}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--surface-soft)] p-3">
            <MapPin
              size={16}
              className="mt-0.5 shrink-0 text-[var(--primary)]"
            />

            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              {order.address.houseNumber},{" "}
              {order.address.street},{" "}
              {order.address.area}
              {order.address.landmark
                ? `, ${order.address.landmark}`
                : ""}
              , {order.address.city},{" "}
              {order.address.state} -{" "}
              {order.address.pincode}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-lg bg-[var(--surface-soft)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
              {totalQuantity} items
            </span>

            <span className="rounded-lg bg-[var(--surface-soft)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
              Total {formatPrice(order.totalAmount)}
            </span>

            {order.savings > 0 && (
              <span className="rounded-lg bg-green-50 px-2.5 py-1.5 text-[10px] font-bold text-[var(--success)]">
                Saved {formatPrice(order.savings)}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Update status
            </span>

            <select
              value={order.status}
              disabled={updating}
              onChange={(event) =>
                onStatusChange(
                  event.target.value as OrderStatus
                )
              }
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-black text-[var(--text-primary)] outline-none disabled:opacity-50"
            >
              {statusOptions.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </label>

          <Link
            href={`/orders/${order.orderNumber}`}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-xs font-black text-white"
          >
            <Eye size={16} />
            View full order
          </Link>

          <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[var(--text-muted)]">
            {order.status === "Delivered" ? (
              <CheckCircle2
                size={14}
                className="text-[var(--success)]"
              />
            ) : order.status === "Cancelled" ? (
              <XCircle
                size={14}
                className="text-[var(--danger)]"
              />
            ) : (
              <Truck
                size={14}
                className="text-[var(--primary)]"
              />
            )}

            Customer order status updates immediately.
          </div>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[20px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-xs)]">
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

const statusTones: Record<OrderStatus, AdminStatusTone> = {
  Placed: "info",
  Confirmed: "info",
  Packing: "warning",
  "Out for Delivery": "info",
  Delivered: "success",
  Cancelled: "danger",
};
