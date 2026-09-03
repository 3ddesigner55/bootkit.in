"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
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
import { formatPrice, normalizeEnvelope } from "@/lib/utils";

type CustomerProfile = {
  _id: string;
  customerCode?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  orderCount?: number;
  totalSpend?: number;
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
  items?: Array<{ name: string; quantity: number }>;
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

  // Pagination for Orders
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const ordersLimit = 3; // Show 3 orders per page
  const isInitialMount = useRef(true);

  // Modals
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletDirection, setWalletDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [walletReason, setWalletReason] = useState("");
  const [isWalletSubmitting, setIsWalletSubmitting] = useState(false);
  const walletAdjustmentKeyRef = useRef<string>("");
  const walletAdjustmentPayloadRef = useRef<{ amount: number; direction: string; reason: string }>({ amount: 0, direction: "", reason: "" });

  const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
  const [restrictionType, setRestrictionType] = useState<"ACCOUNT_BLOCKED" | "ORDERING_BLOCKED" | "COD_DISABLED">("ORDERING_BLOCKED");
  const [restrictionReason, setRestrictionReason] = useState("Suspected suspicious repeat cancellations");
  const [restrictionNote, setRestrictionNote] = useState("");
  const [isRestricting, setIsRestricting] = useState(false);

  const fetchOrders = useCallback(async (pageNumber: number) => {
    if (!accessToken) return;
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const oRes = await fetch(
        `${baseUrl}/admin/customers/${customerId}/orders?page=${pageNumber}&limit=${ordersLimit}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const oData = await oRes.json();
      if (oData.success) {
        const envelope = normalizeEnvelope<any>(oData, "orders");
        setOrders(envelope.items);
        setOrdersTotal(envelope.pagination?.total || envelope.items.length);
      }
    } catch (err) {
      console.error("Failed to load customer orders", err);
    }
  }, [accessToken, customerId, ordersLimit]);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");

      const [cRes, aRes, oRes, rRes, wRes, tRes, reRes] = await Promise.all([
        fetch(`${baseUrl}/admin/customers/${customerId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/addresses`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/orders?page=${ordersPage}&limit=${ordersLimit}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/risk-signals`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/wallet`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/wallet/transactions`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${baseUrl}/admin/customers/${customerId}/restrictions`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      const [cData, aData, oData, rData, wData, tData, reData] = await Promise.all([
        cRes.json(), aRes.json(), oRes.json(), rRes.json(), wRes.json(), tRes.json(), reRes.json(),
      ]);

      if (cData.success) {
        const customerProfile = cData.customer || cData.data;
        if (customerProfile) setCustomer(customerProfile);
      }

      if (aData.success) {
        setAddresses(normalizeEnvelope<any>(aData, "addresses").items);
      }

      if (oData.success) {
        const envelope = normalizeEnvelope<any>(oData, "orders");
        setOrders(envelope.items);
        setOrdersTotal(envelope.pagination?.total || envelope.items.length);
      }

      if (rData.success && rData.data) {
        setRiskSignals(rData.data);
      }

      if (wData.success) {
        const walletVal = wData.wallet || wData.data;
        if (walletVal) setWallet(walletVal);
      }

      if (tData.success) {
        setTransactions(normalizeEnvelope<any>(tData, "transactions").items);
      }

      if (reData.success) {
        setRestrictions(normalizeEnvelope<any>(reData, "restrictions").items);
      }
    } catch (err) {
      console.error("Failed to load customer profile", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, customerId, ordersPage, ordersLimit]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchData();
  }, [accountHydrated, accessToken, fetchData]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    void fetchOrders(ordersPage);
  }, [ordersPage, fetchOrders, accountHydrated, accessToken]);

  const handleToggleBlock = async () => {
    if (!customer) return;
    const isBlocked = customer.status === "BLOCKED";
    if (isBlocked) {
      if (!confirm("Are you sure you want to unblock this customer?")) return;
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/admin/customers/${customerId}/unblock`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to unblock customer.");
        }
        alert("Customer unblocked successfully.");
        void fetchData();
      } catch (err: any) {
        alert(err.message || "Action failed.");
      }
    } else {
      const reason = prompt("Enter reason for blocking this customer:");
      if (reason === null) return;
      if (!reason.trim()) {
        alert("Reason is required to block a customer.");
        return;
      }
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/admin/customers/${customerId}/block`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: reason.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to block customer.");
        }
        alert("Customer blocked successfully.");
        void fetchData();
      } catch (err: any) {
        alert(err.message || "Action failed.");
      }
    }
  };

  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWalletSubmitting(true);

    const parsedAmount = parseFloat(walletAmount);
    const currentAmount = isNaN(parsedAmount) ? 0 : parsedAmount;
    const currentDirection = walletDirection;
    const currentReason = (walletReason || "Admin manual adjustment").trim();

    const payloadChanged =
      walletAdjustmentPayloadRef.current.amount !== currentAmount ||
      walletAdjustmentPayloadRef.current.direction !== currentDirection ||
      walletAdjustmentPayloadRef.current.reason !== currentReason;

    if (payloadChanged || !walletAdjustmentKeyRef.current) {
      walletAdjustmentKeyRef.current = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `adj-${customerId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      walletAdjustmentPayloadRef.current = {
        amount: currentAmount,
        direction: currentDirection,
        reason: currentReason,
      };
    }

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/customers/${customerId}/wallet/adjustments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: currentAmount,
          direction: currentDirection,
          reason: currentReason,
          idempotencyKey: walletAdjustmentKeyRef.current,
        }),
      });

      // Parse the response first! If it's malformed, this throws and key is preserved.
      const data = await res.json();

      // Clear only after confirmed success (2xx) or definitive 4xx rejections.
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        walletAdjustmentKeyRef.current = "";
        walletAdjustmentPayloadRef.current = { amount: 0, direction: "", reason: "" };
      }

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
                    {customer.firstName || "N/A"} {customer.lastName || ""}
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-500 font-black">
                    {customer.customerCode || "ID Pending"}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      customer.status === "BLOCKED"
                        ? "bg-red-50 text-red-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {customer.status || "ACTIVE"}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Phone: {maskPhone(customer.phone) || "N/A"} | Member since {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleBlock}
                className={`h-10 px-4 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                  customer.status === "BLOCKED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                <Ban size={15} />
                {customer.status === "BLOCKED" ? "Unblock Customer" : "Block Customer"}
              </button>

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
                  <p>Customer Code: <strong className="font-mono text-slate-900">{customer.customerCode || "ID Pending"}</strong></p>
                  <p>Database ID: <strong className="font-mono text-[10px] text-slate-900">{customer._id}</strong></p>
                  <p>Name: <strong className="text-slate-900">{customer.firstName || "N/A"} {customer.lastName || ""}</strong></p>
                  <p>Email: <strong className="text-slate-900">{customer.email || "Not provided"}</strong></p>
                  <p>Phone: <strong className="font-mono text-slate-900">{maskPhone(customer.phone) || "N/A"}</strong></p>
                  <p>Joined: <strong>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "N/A"}</strong></p>
                  <p>Status: <strong className="text-slate-900">{customer.status || "ACTIVE"}</strong></p>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <MapPin size={16} className="text-[var(--primary)]" />
                  Saved Addresses ({addresses.length})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {addresses.map((addr: any) => (
                    <div key={addr._id} className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm space-y-1 text-xs text-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[10px] text-slate-700">
                          {addr.label || "Address"}
                        </span>
                        <div className="flex gap-1.5">
                          {addr.recipientType && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-bold">
                              {addr.recipientType}
                            </span>
                          )}
                          {addr.isDefault && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-slate-900">{addr.fullName || "N/A"}</p>
                      {addr.phone && <p className="text-slate-500 font-mono text-[10px]">{addr.phone}</p>}
                      <p>{addr.addressLine1}</p>
                      {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                      {addr.landmark && <p className="text-slate-400">Landmark: {addr.landmark}</p>}
                      <p>{addr.city}, {addr.state} - <strong className="font-mono text-slate-900">{addr.postalCode}</strong></p>
                      {addr.googleMapsLink && (
                        <a
                          href={addr.googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold"
                        >
                          View on Google Maps
                        </a>
                      )}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
              {/* Left Column: Risk & Order Stats Card */}
              <div className="bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
                <h2 className="text-xs font-black text-slate-800 flex items-center gap-2 pb-3 border-b">
                  <span className="text-base">🛡️</span> RISK & ORDER STATS
                </h2>

                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Fraud Risk Level:</span>
                    {(() => {
                      const ratePercent = riskSignals ? parseFloat(riskSignals.cancellationRate) : 0;
                      const isHigh = ratePercent > 30;
                      const isMed = ratePercent > 15;
                      return (
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          isHigh ? "text-red-700 bg-red-50" : isMed ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"
                        }`}>
                          {isHigh ? "🔴 HIGH" : isMed ? "🟡 MEDIUM" : "🟢 LOW"}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Total Orders:</span>
                    <strong className="text-slate-900 font-mono text-sm">{riskSignals?.totalOrders || 0}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Total Spent:</span>
                    <strong className="text-slate-900 font-mono text-sm">{customer ? formatPrice(customer.totalSpend || 0) : "₹0"}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Cancelled:</span>
                    <span className="font-bold text-red-600">
                      {riskSignals?.cancelledOrders || 0} ({riskSignals?.cancellationRate || "0%"})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">COD Refusals:</span>
                    <span className="font-bold text-slate-900 font-mono">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Avg. Order Val:</span>
                    <strong className="text-slate-900 font-mono">
                      {(() => {
                        const count = riskSignals?.totalOrders || 0;
                        const spent = customer?.totalSpend || 0;
                        return formatPrice(count > 0 ? Math.round(spent / count) : 0);
                      })()}
                    </strong>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <span className="font-black text-slate-800 flex items-center gap-1 text-[11px]">
                      <span className="text-sm">⚠️</span> System Note:
                    </span>
                    <p className="p-3.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed italic">
                      {(() => {
                        const ratePercent = riskSignals ? parseFloat(riskSignals.cancellationRate) : 0;
                        if (ratePercent > 30) {
                          return "High cancellation rate detected. Recommend disabling cash on delivery (COD) payment options.";
                        }
                        if (ratePercent > 15) {
                          return "Moderate cancellation activity. Keep under monitoring for cash-on-delivery orders.";
                        }
                        return "Good customer. Order fulfillment rate is excellent. Mostly pays via UPI.";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Recent Orders List/Table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 font-black text-sm text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛍️</span> RECENT ORDERS (Total: {ordersTotal})
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                        <th className="py-3.5 px-5">Order ID</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {orders.map((o) => (
                        <tr key={o._id} className="hover:bg-slate-50/40 transition">
                          <td className="py-4 px-5 align-top">
                            <div className="space-y-1">
                              <Link href={`/admin/orders/${o.orderNumber}`} className="font-black text-[var(--primary)] hover:underline">
                                #{o.orderNumber}
                              </Link>
                              {o.items && o.items.length > 0 && (
                                <p className="text-[10px] text-slate-400 font-bold">
                                  {o.items.reduce((acc, it) => acc + it.quantity, 0)} Item
                                  {o.items.reduce((acc, it) => acc + it.quantity, 0) > 1 ? "s" : ""}{" "}
                                  ({o.items.map((it) => it.name).join(", ")})
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-500 align-top pt-5">
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short"
                            })}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 align-top pt-5">
                            {formatPrice(o.grandTotal)}
                          </td>
                          <td className="py-4 px-4 align-top pt-4">
                            <div className="flex items-center justify-between gap-2">
                              {(() => {
                                const status = o.status;
                                let statusClass = "text-blue-700 bg-blue-50";
                                let statusText = status;
                                if (status === "DELIVERED") {
                                  statusClass = "text-emerald-700 bg-emerald-50";
                                  statusText = "✅ Deliv";
                                } else if (status === "CANCELLED") {
                                  statusClass = "text-red-700 bg-red-50";
                                  statusText = "❌ Cancel";
                                } else if (status === "IN_TRANSIT") {
                                  statusClass = "text-amber-700 bg-amber-50";
                                  statusText = "🚚 Transit";
                                }
                                return (
                                  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${statusClass}`}>
                                    {statusText}
                                  </span>
                                );
                              })()}

                              <Link
                                href={`/admin/orders/${o.orderNumber}`}
                                className="inline-flex h-6 items-center px-2 rounded border border-slate-200 text-[9px] font-bold text-slate-600 hover:bg-slate-50 transition"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">
                            No orders placed by this customer yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {ordersTotal > ordersLimit && (
                  <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-4 bg-slate-50/50">
                    <button
                      type="button"
                      disabled={ordersPage === 1}
                      onClick={() => setOrdersPage((p) => Math.max(p - 1, 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      &lt; Prev Page
                    </button>
                    <span className="text-[10px] font-black text-slate-500 font-mono">
                      Page {ordersPage} of {Math.ceil(ordersTotal / ordersLimit)}
                    </span>
                    <button
                      type="button"
                      disabled={ordersPage >= Math.ceil(ordersTotal / ordersLimit)}
                      onClick={() => setOrdersPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next Page &gt;
                    </button>
                  </div>
                )}
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
