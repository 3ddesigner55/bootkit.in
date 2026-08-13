"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  Wallet,
  ShoppingBag,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  ChevronRight,
  UserCheck,
  Ban,
  ArrowUpDown,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { formatPrice } from "@/lib/utils";

type CustomerSummaryData = {
  totalCustomers: number;
  newCustomers7Days: number;
  activeCustomers: number;
  accountBlockedCount: number;
  orderingBlockedCount: number;
  codDisabledCount: number;
  totalWalletLiability: number;
};

type CustomerItem = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  isActive: boolean;
  status: string;
  orderCount: number;
  totalSpend: number;
  createdAt: string;
  walletBalance?: number;
};

export default function AdminCustomersPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [summary, setSummary] = useState<CustomerSummaryData | null>(null);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSummary = useCallback(async () => {
    if (!accessToken) return;
    try {
      setSummaryLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/customers/summary`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error("Failed to load customer summary", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [accessToken]);

  const fetchCustomers = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`${baseUrl}/admin/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || data.customers.length);
      }
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, searchQuery, statusFilter]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    void fetchSummary();
  }, [accountHydrated, accessToken, fetchSummary]);

  useEffect(() => {
    if (!accountHydrated || !accessToken) return;
    const timeout = setTimeout(() => {
      void fetchCustomers();
    }, 250);
    return () => clearTimeout(timeout);
  }, [accountHydrated, accessToken, fetchCustomers, page, searchQuery, statusFilter]);

  const maskPhone = (phone?: string) => {
    if (!phone) return "N/A";
    if (phone.length <= 4) return phone;
    return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-8">
        <Container className="max-w-7xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <Users size={22} className="text-[var(--primary)]" />
                Customer Management
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                360-degree customer profiles, immutable wallet ledgers, and fraud protection
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void fetchSummary();
                void fetchCustomers();
              }}
              className="flex h-10 items-center gap-2 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-[var(--text-primary)] hover:bg-slate-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Customers</span>
              <p className="text-lg font-black text-slate-900">
                {summaryLoading ? "--" : summary?.totalCustomers ?? 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">New (7 Days)</span>
              <p className="text-lg font-black text-emerald-600">
                {summaryLoading ? "--" : summary?.newCustomers7Days ?? 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Active Accounts</span>
              <p className="text-lg font-black text-slate-900">
                {summaryLoading ? "--" : summary?.activeCustomers ?? 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Account Blocked</span>
              <p className="text-lg font-black text-red-600">
                {summaryLoading ? "--" : summary?.accountBlockedCount ?? 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">COD Disabled</span>
              <p className="text-lg font-black text-amber-600">
                {summaryLoading ? "--" : summary?.codDisabledCount ?? 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">Wallet Liability</span>
              <p className="text-lg font-black text-purple-600">
                {summaryLoading ? "--" : formatPrice(summary?.totalWalletLiability ?? 0)}
              </p>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm mb-6 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="Search by customer name, mobile, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-[var(--border)] rounded-xl text-xs outline-none focus:border-[var(--primary)] focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            >
              <option value="ALL">All Customers</option>
              <option value="Active">Active Accounts</option>
              <option value="Blocked">Blocked Accounts</option>
            </select>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4">Orders</th>
                    <th className="py-3.5 px-4">Total Spend</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-bold">
                        <Link
                          href={`/admin/customers/${c._id}`}
                          className="text-slate-900 hover:text-[var(--primary)] flex items-center gap-1.5"
                        >
                          {c.firstName} {c.lastName}
                        </Link>
                        {c.email && (
                          <span className="text-[10px] text-slate-400 block font-normal">{c.email}</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-600">
                        {maskPhone(c.phone)}
                      </td>

                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800">
                        {c.orderCount || 0}
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900">
                        {formatPrice(c.totalSpend || 0)}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            c.isActive && c.status !== "BLOCKED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {c.status === "BLOCKED" || !c.isActive ? "Blocked" : "Active"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/customers/${c._id}`}
                          className="inline-flex h-8 items-center gap-1 px-3 rounded-lg border border-[var(--border)] text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          View Profile
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No customers found matching filter criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Page {page} of {totalPages} ({totalCount} customers)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 rounded-lg border border-[var(--border)] font-bold text-slate-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 rounded-lg border border-[var(--border)] font-bold text-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </Container>
      </main>
    </div>
  );
}
