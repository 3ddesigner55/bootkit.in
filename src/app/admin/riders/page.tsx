"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Battery,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";

type RiderSummary = {
  totalRiders: number;
  pendingVerification: number;
  verifiedRiders: number;
  activeShiftRiders: number;
  idleRiders: number;
  onTripRiders: number;
  offlineRiders: number;
  suspendedRiders: number;
};

type RiderItem = {
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
  };
  vehicleType: string;
  vehicleRegNumber: string;
  onboardingStatus: string;
  availabilityStatus: string;
  lastHeartbeatAt?: string | null;
  earningsBalance: number;
  createdAt: string;
};

export default function AdminRidersPage() {
  const { session, hydrated: accountHydrated } = useAccount();
  const accessToken = session?.accessToken || "";

  const [summary, setSummary] = useState<RiderSummary | null>(null);
  const [riders, setRiders] = useState<RiderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Filters
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
      const res = await fetch(`${baseUrl}/admin/riders/summary`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error("Failed to load rider summary", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [accessToken]);

  const fetchRiders = useCallback(async () => {
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

      const res = await fetch(`${baseUrl}/admin/riders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.riders)) {
        setRiders(data.riders);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || data.riders.length);
      }
    } catch (err) {
      console.error("Failed to load riders", err);
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
      void fetchRiders();
    }, 250);
    return () => clearTimeout(timeout);
  }, [accountHydrated, accessToken, fetchRiders, page, searchQuery, statusFilter]);

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
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <Truck size={22} className="text-[var(--primary)]" />
                Rider Fleet Management
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Onboarding, live dispatch tracking, shifts, and weekly earnings settlements
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/riders/live"
                className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
              >
                <MapPin size={15} className="text-blue-600" />
                Live Fleet View
              </Link>

              <Link
                href="/admin/riders/payouts"
                className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
              >
                Weekly Payouts
              </Link>

              <Link
                href="/admin/riders/new"
                className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                Onboard New Rider
              </Link>
            </div>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            <div className="bg-white p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Total Fleet</span>
              <p className="text-base font-black text-slate-900">
                {summaryLoading ? "--" : summary?.totalRiders ?? 0}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Pending KYC</span>
              <p className="text-base font-black text-amber-600">
                {summaryLoading ? "--" : summary?.pendingVerification ?? 0}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Verified</span>
              <p className="text-base font-black text-emerald-600">
                {summaryLoading ? "--" : summary?.verifiedRiders ?? 0}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Active Shift</span>
              <p className="text-base font-black text-blue-600">
                {summaryLoading ? "--" : summary?.activeShiftRiders ?? 0}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Idle (Ready)</span>
              <p className="text-base font-black text-emerald-600">
                {summaryLoading ? "--" : summary?.idleRiders ?? 0}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">On Delivery</span>
              <p className="text-base font-black text-purple-600">
                {summaryLoading ? "--" : summary?.onTripRiders ?? 0}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Offline</span>
              <p className="text-base font-black text-slate-500">
                {summaryLoading ? "--" : summary?.offlineRiders ?? 0}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Suspended</span>
              <p className="text-base font-black text-red-600">
                {summaryLoading ? "--" : summary?.suspendedRiders ?? 0}
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm mb-6 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                placeholder="Search by rider code, vehicle number, or license..."
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
              <option value="ALL">All Operational Statuses</option>
              <option value="AVAILABLE">Available / Idle</option>
              <option value="ASSIGNED">Assigned Order</option>
              <option value="ON_DELIVERY">On Delivery</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          {/* Riders Table */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-3.5 px-4">Rider Code</th>
                    <th className="py-3.5 px-4">Rider Name</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Assigned Hub</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Verification</th>
                    <th className="py-3.5 px-4">Availability</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {riders.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {r.riderCode}
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800">
                        <Link href={`/admin/riders/${r._id}`} className="hover:text-[var(--primary)]">
                          {r.user ? `${r.user.firstName} ${r.user.lastName}` : "Rider"}
                        </Link>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-600">
                        {maskPhone(r.user?.phone)}
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-bold">
                        {r.assignedStore?.name || "Unassigned"}
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        {r.vehicleType} ({r.vehicleRegNumber})
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            r.onboardingStatus === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700"
                              : r.onboardingStatus === "SUSPENDED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {r.onboardingStatus}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            r.availabilityStatus === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.availabilityStatus === "ON_DELIVERY" || r.availabilityStatus === "ASSIGNED"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.availabilityStatus}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/riders/${r._id}`}
                          className="inline-flex h-8 items-center gap-1 px-3 rounded-lg border border-[var(--border)] text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          View 360
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {riders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No riders found in the fleet matching current criteria
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
                  Page {page} of {totalPages} ({totalCount} riders)
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
