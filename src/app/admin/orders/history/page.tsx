"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type HistoryOrder = {
  _id: string;
  orderNumber: string;
  store: { name: string } | string;
  user: { firstName: string; lastName: string; phone: string };
  rider?: { fullName: string } | null;
  items: Array<{ name: string; quantity: number }>;
  grandTotal: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string;
};

export default function AdminOrderHistoryPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DELIVERED" | "CANCELLED">("ALL");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "TODAY" | "YESTERDAY" | "7DAYS">("ALL");

  const fetchHistory = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/orders?limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const terminalOrders = data.orders.filter((o: any) =>
          ["DELIVERED", "CANCELLED"].includes(o.status)
        );
        setOrders(terminalOrders);
      }
    } catch (err) {
      console.error("Error fetching order history", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchHistory();
  }, [accountHydrated, accessToken, fetchHistory]);

  const maskPhone = (phone?: string) => {
    if (!phone) return "N/A";
    if (phone.length <= 4) return phone;
    return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
  };

  const calculateDuration = (start: string, end?: string | null) => {
    if (!end) return "--";
    const diffMins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (60 * 1000));
    if (diffMins < 0) return "--";
    return `${diffMins} min`;
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;

    if (timeFilter !== "ALL") {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      if (timeFilter === "TODAY") {
        if (orderDate.toDateString() !== now.toDateString()) return false;
      } else if (timeFilter === "7DAYS") {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchCustomer = `${o.user?.firstName} ${o.user?.lastName}`.toLowerCase().includes(q);
      if (!matchNum && !matchCustomer) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/orders"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[var(--text-primary)]">
                  Completed & Cancelled Order History
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Immutable audit records of delivered and cancelled orders
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchHistory()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm mb-6 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="Search Order # or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)] focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 px-3 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Terminal Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="h-10 px-3 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7DAYS">Last 7 Days</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Date / Time</th>
                    <th className="py-3.5 px-4">Order Number</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Order Value</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Final Status</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-4 px-4 font-black">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="text-[var(--primary)] hover:underline"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">
                          {order.user?.firstName} {order.user?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {maskPhone(order.user?.phone)}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900">
                        {formatPrice(order.grandTotal)}
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {order.status === "DELIVERED" ? (
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-emerald-600" />
                            {calculateDuration(order.createdAt, order.deliveredAt)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Cancelled</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {order.status === "DELIVERED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700">
                            <CheckCircle size={12} />
                            Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-700">
                            <XCircle size={12} />
                            Cancelled
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-[11px] text-slate-600">
                        <span className="font-bold">{order.paymentMethod}</span> ({order.paymentStatus})
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="inline-flex h-8 items-center gap-1 px-3 rounded-lg border border-[var(--border)] text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          View Detail
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No historical orders matching criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
