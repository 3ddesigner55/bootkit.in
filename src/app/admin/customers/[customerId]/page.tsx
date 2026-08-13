"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  MapPin,
  ShoppingBag,
  Wallet,
  ShieldAlert,
  Clock,
  Plus,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
  Ban,
  Lock,
  DollarSign,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type CustomerProfile = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
};

type AddressItem = {
  _id: string;
  label?: string;
  recipientName?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
};

type OrderItem = {
  _id: string;
  orderNumber: string;
  store?: { name: string };
  grandTotal: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  deliveredAt?: string | null;
  cancelReason?: string;
};

type RiskSignals = {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  cancellationRate: string;
  refundCount: number;
};

type WalletData = {
  balance: number; // in paise
  status: string;
};

type WalletTx = {
  _id: string;
  direction: "CREDIT" | "DEBIT";
  transactionType: string;
  amount: number; // in paise
  balanceAfter: number;
  adminReason?: string;
  isReversed?: boolean;
  createdAt: string;
};

type RestrictionItem = {
  _id: string;
  restrictionType: "ACCOUNT_BLOCKED" | "ORDERING_BLOCKED" | "COD_DISABLED";
  active: boolean;
  reasonCode: string;
  note?: string;
  createdAt: string;
  expiresAt?: string | null;
};

export default function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [activeTab, setActiveTab] = useState<"info" | "orders" | "wallet" | "security">("info");

  // State
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [riskSignals, setRiskSignals] = useState<RiskSignals | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [restrictions, setRestrictions] = useState<RestrictionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletDirection, setWalletDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [walletReason, setWalletReason] = useState("");
  const [isWalletSubmitting, setIsWalletSubmitting] = useState(false);

  const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
  const [restrictionType, setRestrictionType] = useState<"ACCOUNT_BLOCKED" | "ORDERING_BLOCKED" | "COD_DISABLED">("ORDERING_BLOCKED");
  const [restrictionReason, setRestrictionReason] = useState("Suspected suspicious repeat cancellations");
  const [restrictionNote, setRestrictionNote] = useState("");
  const [isRestricting, setIsRestricting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");

      const [cRes, aRes, oRes, rRes, wRes, tRes, reRes] = await Promise.all([
        fetch(`${baseUrl}/admin/customers/${customerId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/addresses`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/orders`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/risk-signals`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/wallet`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/wallet/transactions`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/restrictions`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      const [cData, aData, oData, rData, wData, tData, reData] = await Promise.all([
        cRes.json(), aRes.json(), oRes.json(), rRes.json(), wRes.json(), tRes.json(), reRes.json(),
      ]);

      if (cData.success && cData.customer) setCustomer(cData.customer);
      if (aData.success && Array.isArray(aData.addresses)) setAddresses(aData.addresses);
      if (oData.success && Array.isArray(oData.orders)) setOrders(oData.orders);
      if (rData.success && rData.data) setRiskSignals(rData.data);
      if (wData.success && wData.wallet) setWallet(wData.wallet);
      if (tData.success && Array.isArray(tData.transactions)) setTransactions(tData.transactions);
      if (reData.success && Array.isArray(reData.restrictions)) setRestrictions(reData.restrictions);
    } catch (err) {
      console.error("Failed to load customer profile", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, customerId]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchData();
  }, [accountHydrated, accessToken, fetchData]);

  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWalletSubmitting(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/customers/${customerId}/wallet/adjustments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(walletAmount),
          direction: walletDirection,
          reason: walletReason || "Admin manual adjustment",
          idempotencyKey: `adj-${customerId}-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to adjust wallet funds.");
      }
      setIsWalletModalOpen(false);
      setWalletAmount("");
      setWalletReason("");
      void fetchData();
    } catch (err: any) {
      alert(err.message || "Wallet adjustment failed.");
    } finally {
      setIsWalletSubmitting(false);
    }
  };

  const handleApplyRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRestricting(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/customers/${customerId}/restrictions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restrictionType,
          reasonCode: restrictionReason,
          note: restrictionNote,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to apply restriction.");
      }
      setIsRestrictionModalOpen(false);
      setRestrictionNote("");
      void fetchData();
    } catch (err: any) {
      alert(err.message || "Action failed.");
    } finally {
      setIsRestricting(false);
    }
  };

  const handleRemoveRestriction = async (restrictionId: string) => {
    if (!confirm("Are you sure you want to lift this restriction?")) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/customers/${customerId}/restrictions/${restrictionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Restriction removed by Admin" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to remove restriction.");
      }
      void fetchData();
    } catch (err: any) {
      alert(err.message || "Action failed.");
    }
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return "N/A";
    if (phone.length <= 4) return phone;
    return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-slate-500 text-sm">
          Loading 360-degree customer profile...
        </Container>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <Container className="py-12 text-center text-red-600 text-sm font-bold">
          Customer not found.
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
                href="/admin/customers"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-[var(--text-primary)]">
                    {customer.firstName} {customer.lastName}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      customer.status === "BLOCKED"
                        ? "bg-red-50 text-red-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {customer.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Phone: {maskPhone(customer.phone)} | Member since {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5 shadow-sm"
              >
                <Wallet size={15} />
                Adjust Wallet
              </button>

              <button
                type="button"
                onClick={() => setIsRestrictionModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 shadow-sm"
              >
                <ShieldAlert size={15} />
                Fraud & Restrictions
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 mb-6 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "info"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <User size={15} />
              Basic Info & Addresses
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "orders"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShoppingBag size={15} />
              Order History & Risk
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "wallet"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Wallet size={15} />
              Bootkit Wallet & Ledger
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 ${
                activeTab === "security"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldAlert size={15} />
              Security Restrictions ({restrictions.length})
            </button>
          </div>

          {/* TAB A: Basic Information & Addresses */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 space-y-3">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <User size={16} className="text-[var(--primary)]" />
                  Account Summary
                </h2>
                <div className="text-xs space-y-2 text-slate-600">
                  <p>Customer ID: <strong className="font-mono text-slate-900">{customer._id}</strong></p>
                  <p>Name: <strong className="text-slate-900">{customer.firstName} {customer.lastName}</strong></p>
                  <p>Email: <strong className="text-slate-900">{customer.email || "Not provided"}</strong></p>
                  <p>Phone: <strong className="font-mono text-slate-900">{maskPhone(customer.phone)}</strong></p>
                  <p>Joined: <strong>{new Date(customer.createdAt).toLocaleDateString()}</strong></p>
                  <p>Status: <strong className="text-slate-900">{customer.status}</strong></p>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <MapPin size={16} className="text-[var(--primary)]" />
                  Saved Addresses ({addresses.length})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm space-y-1 text-xs text-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[10px] text-slate-700">
                          {addr.label || "Address"}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900">{addr.recipientName || `${customer.firstName} ${customer.lastName}`}</p>
                      <p>{addr.street}</p>
                      <p>{addr.city}, {addr.state} - <strong className="font-mono text-slate-900">{addr.pincode}</strong></p>
                      {addr.landmark && <p className="text-slate-400">Landmark: {addr.landmark}</p>}
                    </div>
                  ))}

                  {addresses.length === 0 && (
                    <div className="sm:col-span-2 bg-white p-8 rounded-2xl border text-center text-xs text-slate-400">
                      No saved addresses recorded for this customer.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB B: Customer Order History & Risk Signals */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Risk Signals */}
              {riskSignals && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Placed</span>
                    <p className="text-lg font-black text-slate-900">{riskSignals.totalOrders}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Delivered</span>
                    <p className="text-lg font-black text-emerald-600">{riskSignals.deliveredOrders}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Cancelled</span>
                    <p className="text-lg font-black text-red-600">{riskSignals.cancelledOrders}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Cancellation Rate</span>
                    <p className="text-lg font-black text-slate-900">{riskSignals.cancellationRate}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Refund Requests</span>
                    <p className="text-lg font-black text-purple-600">{riskSignals.refundCount}</p>
                  </div>
                </div>
              )}

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800">
                  Order History ({orders.length})
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {orders.map((o) => (
                        <tr key={o._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-black">
                            <Link href={`/admin/orders/${o.orderNumber}`} className="text-[var(--primary)] hover:underline">
                              #{o.orderNumber}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {formatPrice(o.grandTotal)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {o.paymentMethod}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/admin/orders/${o.orderNumber}`}
                              className="inline-flex h-7 items-center gap-1 px-2.5 rounded-lg border border-[var(--border)] text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No orders placed by this customer yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB C: Bootkit Wallet & Ledger */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1">Available Wallet Balance</span>
                  <p className="text-3xl font-black text-purple-700">
                    {formatPrice((wallet?.balance || 0) / 100)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(true)}
                  className="h-10 px-5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  Add / Deduct Funds
                </button>
              </div>

              {/* Transactions Ledger */}
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800">
                  Immutable Wallet Ledger ({transactions.length})
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
                      {transactions.map((tx) => (
                        <tr key={tx._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {tx.transactionType}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                tx.direction === "CREDIT"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {tx.direction}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            {formatPrice(tx.amount / 100)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {formatPrice(tx.balanceAfter / 100)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                            {tx.adminReason || "N/A"}
                          </td>
                        </tr>
                      ))}

                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No wallet transactions on record.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB D: Security & Fraud Controls */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800">
                  Active Customer Restrictions
                </h2>

                <button
                  type="button"
                  onClick={() => setIsRestrictionModalOpen(true)}
                  className="h-10 px-4 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  Apply New Restriction
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100 font-medium">
                  {restrictions.map((r) => (
                    <div key={r._id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                            {r.restrictionType}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{r.reasonCode}</span>
                        </div>
                        {r.note && <p className="text-xs text-slate-500 mt-1">{r.note}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Applied: {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRestriction(r._id)}
                        className="h-8 px-3 rounded-lg border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50"
                      >
                        Remove Restriction
                      </button>
                    </div>
                  ))}

                  {restrictions.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No active restrictions. Customer account in good standing.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal: Adjust Wallet */}
          {isWalletModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-800">
                    Adjust Customer Wallet
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsWalletModalOpen(false)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleWalletAdjustment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adjustment Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="direction"
                          value="CREDIT"
                          checked={walletDirection === "CREDIT"}
                          onChange={() => setWalletDirection("CREDIT")}
                          className="accent-[var(--primary)]"
                        />
                        Credit (Add Funds)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="direction"
                          value="DEBIT"
                          checked={walletDirection === "DEBIT"}
                          onChange={() => setWalletDirection("DEBIT")}
                          className="accent-[var(--primary)]"
                        />
                        Debit (Deduct Funds)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      placeholder="e.g. 100"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Goodwill credit, promotional refund"
                      value={walletReason}
                      onChange={(e) => setWalletReason(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsWalletModalOpen(false)}
                      className="h-10 px-4 rounded-xl border text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isWalletSubmitting}
                      className="h-10 px-5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isWalletSubmitting ? "Processing..." : "Confirm Adjustment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Apply Restriction */}
          {isRestrictionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-800">
                    Apply Security Restriction
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsRestrictionModalOpen(false)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleApplyRestriction} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Restriction Type
                    </label>
                    <select
                      value={restrictionType}
                      onChange={(e) => setRestrictionType(e.target.value as any)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] bg-white"
                    >
                      <option value="ORDERING_BLOCKED">Ordering Blocked (Cannot place new orders)</option>
                      <option value="COD_DISABLED">COD Disabled (Online payment only)</option>
                      <option value="ACCOUNT_BLOCKED">Account Blocked (Revoke OTP & login)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reason Code
                    </label>
                    <input
                      type="text"
                      required
                      value={restrictionReason}
                      onChange={(e) => setRestrictionReason(e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Internal Investigation Note
                    </label>
                    <textarea
                      rows={3}
                      value={restrictionNote}
                      onChange={(e) => setRestrictionNote(e.target.value)}
                      placeholder="e.g. Repeated delivery refusals at doorstep on 3 consecutive orders"
                      className="w-full p-3 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRestrictionModalOpen(false)}
                      className="h-10 px-4 rounded-xl border text-xs font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isRestricting}
                      className="h-10 px-5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                    >
                      {isRestricting ? "Applying..." : "Apply Restriction"}
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
