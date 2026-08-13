"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  User,
  CreditCard,
  Truck,
  RotateCcw,
  AlertTriangle,
  FileText,
  DollarSign,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type OrderItem = {
  product: { _id: string; name: string } | string;
  name: string;
  thumbnail: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  total: number;
};

type OrderDetail = {
  _id: string;
  orderNumber: string;
  store: { name: string; city: string };
  user: { firstName: string; lastName: string; email: string; phone: string };
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  tax: number;
  grandTotal: number;
  couponCode?: string;
  couponDiscount?: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  statusHistory?: Array<{
    oldStatus: string;
    newStatus: string;
    reason: string;
    timestamp: string;
  }>;
  rider?: { fullName: string; phone: string } | null;
  cancelReason?: string;
  createdAt: string;
  deliveredAt?: string | null;
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");
  const [isRefunding, setIsRefunding] = useState(false);

  // Replacement Modal State
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [replacementReason, setReplacementReason] = useState<string>("");
  const [isReplacing, setIsReplacing] = useState(false);

  const fetchOrderDetail = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/orders/${orderNumber}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setRefundAmount(String(data.order.grandTotal));
      } else {
        setError(data.message || "Order not found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchOrderDetail();
  }, [accessToken, accountHydrated, orderNumber]);

  const handleInitiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsRefunding(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/orders/${order.orderNumber}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(refundAmount),
          reason: refundReason || "Admin initiated refund",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Refund failed.");
      }
      alert("Refund processed successfully!");
      setIsRefundModalOpen(false);
      void fetchOrderDetail();
    } catch (err: any) {
      alert(err.message || "Failed to process refund.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleCreateReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsReplacing(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/orders/${order.orderNumber}/replacement`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: replacementReason || "Admin Replacement Order",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Replacement order creation failed.");
      }
      alert(`Replacement Order created: #${data.replacementOrder.orderNumber}`);
      setIsReplacementModalOpen(false);
      window.location.assign(`/admin/orders/live`);
    } catch (err: any) {
      alert(err.message || "Replacement creation failed.");
    } finally {
      setIsReplacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading order details...
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-red-600 text-sm font-bold">
          {error || "Order not found."}
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-6xl">
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
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-[var(--text-primary)]">
                    Order #{order.orderNumber}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Placed on {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(true)}
                className="h-10 px-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 flex items-center gap-1.5"
              >
                <DollarSign size={15} />
                Initiate Refund
              </button>

              <button
                type="button"
                onClick={() => setIsReplacementModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5"
              >
                <RotateCcw size={15} />
                Create Replacement
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Order Items & Snapshot */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items Card */}
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Package size={16} className="text-[var(--primary)]" />
                  Order Items Snapshot
                </h2>

                <div className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          MRP: {formatPrice(item.mrp)} | Unit Price: {formatPrice(item.sellingPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">
                          {item.quantity} x {formatPrice(item.sellingPrice)}
                        </p>
                        <p className="text-[11px] font-bold text-slate-500">
                          {formatPrice(item.total || item.sellingPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-slate-100 mt-4 pt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge</span>
                    <span>{formatPrice(order.deliveryCharge)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-100 pt-2 mt-2">
                    <span>Grand Total</span>
                    <span>{formatPrice(order.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-[var(--primary)]" />
                  Status Timeline & Audit Trail
                </h2>

                <div className="space-y-4">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    order.statusHistory.map((hist, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <div className="h-2 w-2 rounded-full bg-[var(--primary)] mt-1.5" />
                        <div>
                          <p className="font-bold text-slate-800">
                            {hist.oldStatus} → <span className="text-[var(--primary)]">{hist.newStatus}</span>
                          </p>
                          {hist.reason && (
                            <p className="text-slate-500 text-[11px]">{hist.reason}</p>
                          )}
                          <p className="text-[10px] text-slate-400">
                            {new Date(hist.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No timeline history recorded.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Customer & Delivery Snapshot */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <User size={16} className="text-[var(--primary)]" />
                  Customer Details
                </h2>
                <div className="text-xs space-y-1 text-slate-600">
                  <p className="font-bold text-slate-900">
                    {order.user?.firstName} {order.user?.lastName}
                  </p>
                  <p>{order.user?.email}</p>
                  <p className="font-mono">{order.user?.phone}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-[var(--primary)]" />
                  Delivery Address Snapshot
                </h2>
                {order.address ? (
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>{order.address.street}</p>
                    <p>
                      {order.address.city}, {order.address.state} - {order.address.pincode}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No delivery address stored.</p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-[var(--primary)]" />
                  Payment Summary
                </h2>
                <div className="text-xs space-y-1 text-slate-600">
                  <p>Method: <strong className="text-slate-800">{order.paymentMethod}</strong></p>
                  <p>Status: <strong className="text-slate-800">{order.paymentStatus}</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Modal */}
          {isRefundModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
                <h3 className="text-base font-black text-slate-800 mb-4">
                  Initiate Refund: #{order.orderNumber}
                </h3>
                <form onSubmit={handleInitiateRefund} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Refund Amount (₹)
                    </label>
                    <input
                      type="number"
                      max={order.grandTotal}
                      min={1}
                      step="0.01"
                      required
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Max refundable: {formatPrice(order.grandTotal)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Refund Reason
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g. Item missing, customer request"
                      className="w-full p-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRefundModalOpen(false)}
                      className="h-10 px-4 rounded-xl border border-[var(--border)] text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isRefunding}
                      className="h-10 px-5 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isRefunding ? "Processing..." : "Confirm Refund"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Replacement Modal */}
          {isReplacementModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
                <h3 className="text-base font-black text-slate-800 mb-4">
                  Create Replacement Order: #{order.orderNumber}
                </h3>
                <form onSubmit={handleCreateReplacement} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Reason for Replacement
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={replacementReason}
                      onChange={(e) => setReplacementReason(e.target.value)}
                      placeholder="e.g. Damaged package on arrival, missing item"
                      className="w-full p-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReplacementModalOpen(false)}
                      className="h-10 px-4 rounded-xl border border-[var(--border)] text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isReplacing}
                      className="h-10 px-5 rounded-xl bg-[var(--primary)] text-xs font-bold text-white hover:brightness-95 disabled:opacity-50"
                    >
                      {isReplacing ? "Creating..." : "Confirm Replacement"}
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
