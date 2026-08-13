"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Phone,
  UserCheck,
  MapPin,
  Clock,
  AlertCircle,
  Truck,
  RefreshCw,
  X,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type InTransitOrder = {
  _id: string;
  orderNumber: string;
  store: { _id: string; name: string } | string;
  user: { firstName: string; lastName: string; phone: string };
  rider?: {
    _id: string;
    fullName: string;
    phone: string;
    availabilityStatus?: string;
  } | null;
  grandTotal: number;
  status: string;
  createdAt: string;
  estimatedDeliveryTime?: string | null;
  updatedAt: string;
};

type RiderOption = {
  _id: string;
  fullName: string;
  phone: string;
  availabilityStatus: string;
};

export default function AdminInTransitOrdersPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [orders, setOrders] = useState<InTransitOrder[]>([]);
  const [riders, setRiders] = useState<RiderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [delayedOnly, setDelayedOnly] = useState(false);

  // Reassignment Modal State
  const [selectedOrder, setSelectedOrder] = useState<InTransitOrder | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/orders?limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        // In-transit orders: ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY, READY_FOR_PICKUP
        const transitOrders = data.orders.filter((o: any) =>
          ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "READY_FOR_PICKUP"].includes(o.status)
        );
        setOrders(transitOrders);
      }
    } catch (err) {
      console.error("Error fetching transit orders", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const fetchRiders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/riders`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.riders)) {
        setRiders(data.riders);
      }
    } catch (err) {
      console.error("Error fetching riders", err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchOrders();
    void fetchRiders();
  }, [accountHydrated, accessToken, fetchOrders, fetchRiders]);

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedRiderId) return;

    setReassigning(true);
    setErrorMsg("");

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/orders/${selectedOrder.orderNumber}/assign-rider`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          riderId: selectedRiderId,
          reason: reassignReason || "Admin Reassigned Rider",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reassign rider.");
      }

      setSelectedOrder(null);
      setSelectedRiderId("");
      setReassignReason("");
      await fetchOrders();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reassign rider.");
    } finally {
      setReassigning(false);
    }
  };

  // Mask phone number
  const maskPhone = (phone?: string) => {
    if (!phone) return "N/A";
    if (phone.length <= 4) return phone;
    return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
  };

  // Filtering
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchRider = o.rider?.fullName?.toLowerCase().includes(q);
      if (!matchNum && !matchRider) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-7xl">
          {/* Header */}
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
                  In-Transit & Dispatch Tracking
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Monitor active dispatch, live rider assignments and delivery status
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchOrders()}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm mb-6 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="Search by Order # or Rider name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)] focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Active Statuses</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="ASSIGNED">Rider Assigned</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Order Number</th>
                    <th className="py-3.5 px-4">Rider Assigned</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Live Location</th>
                    <th className="py-3.5 px-4">Elapsed</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOrders.map((order) => {
                    const elapsedMins = Math.floor(
                      (new Date().getTime() - new Date(order.createdAt).getTime()) / (60 * 1000)
                    );

                    return (
                      <tr key={order._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-4 font-black">
                          <Link
                            href={`/admin/orders/${order.orderNumber}`}
                            className="text-[var(--primary)] hover:underline"
                          >
                            #{order.orderNumber}
                          </Link>
                          <p className="text-[10px] text-slate-400">{formatPrice(order.grandTotal)}</p>
                        </td>

                        <td className="py-4 px-4">
                          {order.rider ? (
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <UserCheck size={14} className="text-emerald-600" />
                                {order.rider.fullName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {maskPhone(order.rider.phone)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-amber-600 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md">
                              Unassigned
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                              order.status === "OUT_FOR_DELIVERY"
                                ? "bg-purple-50 text-purple-700"
                                : order.status === "PICKED_UP"
                                ? "bg-blue-50 text-blue-700"
                                : order.status === "ASSIGNED"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <Truck size={12} />
                            {order.status.replaceAll("_", " ")}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1 text-slate-400">
                            <MapPin size={13} />
                            <span className="italic">Live tracking not configured</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-bold text-slate-700">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Clock size={13} />
                            {elapsedMins}m ago
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right space-x-2">
                          {order.rider?.phone && (
                            <a
                              href={`tel:${order.rider.phone}`}
                              className="inline-flex h-8 items-center gap-1 px-2.5 rounded-lg border border-[var(--border)] text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                            >
                              <Phone size={12} />
                              Call
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setSelectedRiderId(order.rider?._id || "");
                            }}
                            className="inline-flex h-8 items-center gap-1 px-2.5 rounded-lg bg-[var(--primary)] text-[11px] font-bold text-white hover:brightness-95"
                          >
                            Reassign
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No in-transit orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reassign Rider Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-800">
                    Reassign Rider: #{selectedOrder.orderNumber}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-4 font-medium flex items-center gap-2">
                    <AlertCircle size={15} />
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleReassign} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Approved Rider
                    </label>
                    <select
                      value={selectedRiderId}
                      onChange={(e) => setSelectedRiderId(e.target.value)}
                      required
                      className="w-full h-11 px-3 border border-[var(--border)] rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[var(--primary)] bg-white"
                    >
                      <option value="">-- Choose Rider --</option>
                      {riders.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.fullName} ({r.availabilityStatus})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Reassignment Reason
                    </label>
                    <textarea
                      value={reassignReason}
                      onChange={(e) => setReassignReason(e.target.value)}
                      rows={3}
                      placeholder="e.g. Previous rider bike breakdown, delay"
                      className="w-full p-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="h-10 px-4 rounded-xl border border-[var(--border)] text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reassigning || !selectedRiderId}
                      className="h-10 px-5 rounded-xl bg-[var(--primary)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50"
                    >
                      {reassigning ? "Reassigning..." : "Confirm Reassignment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
