"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  User,
  Shield,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  FileText,
  Boxes,
  Plus,
  Ban,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type RiderDetail = {
  _id: string;
  riderCode: string;
  user?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  assignedStore?: {
    _id: string;
    name: string;
    slug: string;
    city?: string;
  };
  vehicleType: string;
  vehicleRegNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  licenseNumber: string;
  licenseHolderName: string;
  licenseExpiryDate?: string;
  onboardingStatus: string;
  availabilityStatus: string;
  earningsBalance: number;
  lastHeartbeatAt?: string | null;
  createdAt: string;
};

type DeliveryItem = {
  _id: string;
  orderNumber: string;
  store?: { name: string };
  grandTotal: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  deliveredAt?: string | null;
};

type EarningItem = {
  _id: string;
  direction: "CREDIT" | "DEBIT";
  transactionType: string;
  amount: number;
  balanceAfter: number;
  reason?: string;
  createdAt: string;
};

type AuditItem = {
  _id: string;
  action: string;
  role?: string;
  reason?: string;
  timestamp: string;
};

export default function AdminRiderDetailPage({
  params,
}: {
  params: Promise<{ riderId: string }>;
}) {
  const { riderId } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [activeTab, setActiveTab] = useState<"profile" | "documents" | "deliveries" | "earnings" | "audit">("profile");

  const [rider, setRider] = useState<RiderDetail | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Action Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutUtr, setPayoutUtr] = useState("");
  const [isPayoutSubmitting, setIsPayoutSubmitting] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");

      const [rRes, dRes, eRes, aRes] = await Promise.all([
        fetch(`${baseUrl}/admin/riders/${riderId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/riders/${riderId}/deliveries`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/riders/${riderId}/earnings`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/riders/${riderId}/audit`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      const [rData, dData, eData, aData] = await Promise.all([
        rRes.json(), dRes.json(), eRes.json(), aRes.json(),
      ]);

      if (rData.success && rData.rider) setRider(rData.rider);
      if (dData.success && Array.isArray(dData.orders)) setDeliveries(dData.orders);
      if (eData.success && Array.isArray(eData.earnings)) setEarnings(eData.earnings);
      if (aData.success && Array.isArray(aData.logs)) setAuditLogs(aData.logs);
    } catch (err) {
      console.error("Failed to load rider details", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, riderId]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchData();
  }, [accountHydrated, accessToken, fetchData]);

  const handleApproveKYC = async () => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/riders/${riderId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to approve rider.");
      void fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/riders/${riderId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason || "KYC documents invalid" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to reject rider.");
      setIsRejectModalOpen(false);
      void fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSuspendRider = async () => {
    const reason = prompt("Enter suspension reason:");
    if (!reason) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/riders/${riderId}/suspend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to suspend rider.");
      void fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReactivateRider = async () => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/riders/${riderId}/reactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to reactivate rider.");
      void fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPayoutSubmitting(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/riders/${riderId}/payouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          paymentUtr: payoutUtr,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to record payout.");
      setIsPayoutModalOpen(false);
      setPayoutAmount("");
      setPayoutUtr("");
      void fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPayoutSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading Rider 360-degree profile...
        </Container>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-red-600 text-sm font-bold">
          Rider not found.
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-6xl">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/riders"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-[var(--text-primary)]">
                    {rider.user ? `${rider.user.firstName} ${rider.user.lastName}` : "Rider"}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      rider.onboardingStatus === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : rider.onboardingStatus === "SUSPENDED"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {rider.onboardingStatus}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Code: {rider.riderCode} | Hub: {rider.assignedStore?.name || "Unassigned"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {rider.onboardingStatus !== "APPROVED" && (
                <button
                  type="button"
                  onClick={handleApproveKYC}
                  className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle size={15} />
                  Approve KYC
                </button>
              )}

              {rider.onboardingStatus === "APPROVED" ? (
                <button
                  type="button"
                  onClick={handleSuspendRider}
                  className="h-10 px-4 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 shadow-sm"
                >
                  <Ban size={15} />
                  Suspend Rider
                </button>
              ) : rider.onboardingStatus === "SUSPENDED" ? (
                <button
                  type="button"
                  onClick={handleReactivateRider}
                  className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle size={15} />
                  Reactivate Rider
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5 shadow-sm"
              >
                <DollarSign size={15} />
                Record Payout
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 mb-6 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "profile"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <User size={15} />
              Profile & Vehicle
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("documents")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "documents"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield size={15} />
              KYC Documents
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("deliveries")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "deliveries"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Boxes size={15} />
              Delivery History ({deliveries.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("earnings")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "earnings"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <DollarSign size={15} />
              Earnings & Ledger
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "audit"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText size={15} />
              Audit Log
            </button>
          </div>

          {/* TAB A: Profile & Vehicle */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-3">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <User size={16} className="text-[var(--primary)]" />
                  Rider Information
                </h2>
                <div className="text-xs space-y-2 text-slate-600">
                  <p>Rider Code: <strong className="font-mono text-slate-900">{rider.riderCode}</strong></p>
                  <p>Full Name: <strong className="text-slate-900">{rider.user?.firstName} {rider.user?.lastName}</strong></p>
                  <p>Phone: <strong className="font-mono text-slate-900">{rider.user?.phone}</strong></p>
                  <p>Email: <strong className="text-slate-900">{rider.user?.email || "Not provided"}</strong></p>
                  <p>Assigned Hub: <strong className="text-slate-900">{rider.assignedStore?.name} ({rider.assignedStore?.slug})</strong></p>
                  <p>Joined Date: <strong>{new Date(rider.createdAt).toLocaleDateString()}</strong></p>
                  <p>Current Operational Status: <strong className="text-emerald-600">{rider.availabilityStatus}</strong></p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-3">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Truck size={16} className="text-[var(--primary)]" />
                  Vehicle & License Details
                </h2>
                <div className="text-xs space-y-2 text-slate-600">
                  <p>Vehicle Type: <strong className="text-slate-900">{rider.vehicleType}</strong></p>
                  <p>Registration Number: <strong className="font-mono text-slate-900">{rider.vehicleRegNumber}</strong></p>
                  <p>Model / Color: <strong className="text-slate-900">{rider.vehicleModel} ({rider.vehicleColor})</strong></p>
                  <p>Driving License Number: <strong className="font-mono text-slate-900">{rider.licenseNumber}</strong></p>
                  <p>License Holder: <strong className="text-slate-900">{rider.licenseHolderName}</strong></p>
                  {rider.licenseExpiryDate && (
                    <p>License Expiry: <strong>{new Date(rider.licenseExpiryDate).toLocaleDateString()}</strong></p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB B: Documents */}
          {activeTab === "documents" && (
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Shield size={16} className="text-[var(--primary)]" />
                KYC Verification Documents
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Driving License</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700">
                      Verified
                    </span>
                  </div>
                  <p className="font-mono text-slate-600">DL: {rider.licenseNumber}</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Vehicle Registration (RC)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700">
                      Verified
                    </span>
                  </div>
                  <p className="font-mono text-slate-600">Reg: {rider.vehicleRegNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB C: Delivery History */}
          {activeTab === "deliveries" && (
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800">
                Completed & Active Deliveries ({deliveries.length})
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Hub</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {deliveries.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-black">
                          <Link href={`/admin/orders/${d.orderNumber}`} className="text-[var(--primary)] hover:underline">
                            #{d.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {d.store?.name || "Hub"}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {formatPrice(d.grandTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {d.paymentMethod}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {deliveries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No deliveries dispatched to this rider yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB D: Earnings & Ledger */}
          {activeTab === "earnings" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1">Outstanding Payable Balance</span>
                  <p className="text-3xl font-black text-purple-700">
                    {formatPrice((rider.earningsBalance || 0) / 100)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(true)}
                  className="h-10 px-5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5"
                >
                  <DollarSign size={15} />
                  Record Settlement Payout
                </button>
              </div>

              {/* Earnings Ledger Table */}
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800">
                  Earnings & Settlement Ledger ({earnings.length})
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                        <th className="py-3 px-4">Date / Time</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Direction</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Balance After</th>
                        <th className="py-3 px-4">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {earnings.map((e) => (
                        <tr key={e._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(e.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {e.transactionType}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                e.direction === "CREDIT"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-purple-50 text-purple-700"
                              }`}
                            >
                              {e.direction}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            {formatPrice(e.amount / 100)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {formatPrice(e.balanceAfter / 100)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                            {e.reason || "Delivery payout"}
                          </td>
                        </tr>
                      ))}

                      {earnings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No earning ledger records found for this rider.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB E: Audit History */}
          {activeTab === "audit" && (
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => (
                  <div key={log._id} className="p-4 hover:bg-slate-50/60 transition flex items-start gap-4">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-800">{log.action}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.reason && <p className="text-slate-600 font-normal">{log.reason}</p>}
                    </div>
                  </div>
                ))}

                {auditLogs.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No operational audit logs on record for this rider.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal: Record Payout */}
          {isPayoutModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
                <h3 className="text-base font-black text-slate-800 mb-4">
                  Record Settlement Payout
                </h3>

                <form onSubmit={handleRecordPayout} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payout Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      placeholder="e.g. 1500"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bank Reference / UTR Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR123456789"
                      value={payoutUtr}
                      onChange={(e) => setPayoutUtr(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-mono outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPayoutModalOpen(false)}
                      className="h-10 px-4 rounded-xl border text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPayoutSubmitting}
                      className="h-10 px-5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isPayoutSubmitting ? "Recording..." : "Confirm & Deduct Balance"}
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
